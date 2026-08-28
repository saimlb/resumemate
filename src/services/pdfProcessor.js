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
      throw new Error('No se pudo extraer el texto del PDF. Asegúrate de que es un PDF válido.');
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
      
      // TITULO - SIN EMOJIS
      page.drawText('CV OPTIMIZADO - RESUMEN ATS', {
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

      // Limpiar texto: eliminar emojis y caracteres especiales
      const cleanText = optimizedText
        .replace(/[^\x00-\x7F]/g, '') // Eliminar caracteres no ASCII
        .replace(/[📄📊📝✅❌⚠️🔑💰🎯💡⚡🏆🔍]/g, ''); // Eliminar emojis comunes

      const lines = cleanText.split('\n');
      let y = height - 100;
      let lineCount = 0;
      
      for (const line of lines) {
        if (lineCount > 30) break;
        if (line.trim()) {
          let size = 10;
          if (line.includes('===') || line.includes('---')) {
            size = 12;
          } else if (line.includes('Puntuacion') || line.includes('RECOMENDACIONES')) {
            size = 11;
          }
          
          // Limitar longitud de línea a 70 caracteres
          const textLine = line.substring(0, 70);
          page.drawText(textLine, {
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

      // PIE DE PAGINA
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
      // Fallback: copiar el PDF original
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
