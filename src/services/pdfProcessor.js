const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class PDFProcessor {
  async extractText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error al extraer texto del PDF:', error);
      throw new Error('No se pudo extraer el texto del PDF.');
    }
  }

  async createOptimizedPDF(originalPath, optimizedText) {
    try {
      const outputDir = path.join(__dirname, '..', '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const { PDFDocument, rgb } = require('pdf-lib');
      const doc = await PDFDocument.create();
      const page = doc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      page.drawText('📄 CV OPTIMIZADO - RESUMEN ATS', {
        x: 50,
        y: height - 50,
        size: 16,
        color: rgb(0, 0.4, 0.8)
      });

      page.drawLine({
        start: { x: 50, y: height - 70 },
        end: { x: width - 50, y: height - 70 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });

      const lines = optimizedText.split('\n');
      let y = height - 100;
      let lineCount = 0;
      
      for (const line of lines) {
        if (lineCount > 30) break;
        if (line.trim()) {
          let size = 10;
          if (line.includes('===') || line.includes('---')) {
            size = 12;
          } else if (line.startsWith('📊') || line.startsWith('📝')) {
            size = 11;
          }
          
          page.drawText(line.substring(0, 70), {
            x: 50,
            y: y,
            size: size,
            color: line.includes('RECOMENDACIONES') || line.includes('OPTIMIZADO') 
              ? rgb(0, 0.5, 0) 
              : rgb(0, 0, 0)
          });
          y -= 16;
          lineCount++;
        } else {
          y -= 8;
          lineCount++;
        }
      }

      page.drawText('Generado por ResumeMate - Optimizador ATS', {
        x: 50,
        y: 30,
        size: 8,
        color: rgb(0.5, 0.5, 0.5)
      });

      const pdfBytes = await doc.save();
      
      const outputFilename = `optimized_${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, outputFilename);
      
      fs.writeFileSync(outputPath, pdfBytes);
      
      return outputPath;
    } catch (error) {
      console.error('Error al crear PDF optimizado:', error);
      const outputDir = path.join(__dirname, '..', '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputFilename = `optimized_${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, outputFilename);
      fs.copyFileSync(originalPath, outputPath);
      return outputPath;
    }
  }
}

module.exports = new PDFProcessor(); 
