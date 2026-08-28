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
      
      // ============================================
      // LIMPIEZA EXTREMA DEL TEXTO
      // ============================================
      let cleanText = optimizedText
        // Eliminar emojis
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        // Eliminar caracteres no ASCII (acentos, ñ, etc.)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
        .replace(/ñ/g, 'n')
        .replace(/Ñ/g, 'N')
        // Eliminar caracteres especiales
        .replace(/[^a-zA-Z0-9 .,;:()\-!?]/g, ' ')
        // Reemplazar guiones
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        // Reemplazar comillas
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Eliminar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim();

      // TITULO
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

      const lines = cleanText.split('\n');
      let y = height - 100;
      let lineCount = 0;
      
      for (const line of lines) {
        if (lineCount > 30) break;
        const trimmedLine = line.trim();
        if (trimmedLine) {
          let size = 10;
          if (trimmedLine.includes('===') || trimmedLine.includes('---')) {
            size = 12;
          } else if (trimmedLine.includes('Puntuacion') || trimmedLine.includes('RECOMENDACIONES')) {
            size = 11;
          }
          
          // Limitar longitud y limpiar
          const safeText = trimmedLine
            .substring(0, 70)
            .replace(/[^a-zA-Z0-9 .,;:()\-!?]/g, '');
          
          if (safeText.length > 0) {
            try {
              page.drawText(safeText, {
                x: 50,
                y: y,
                size: size,
                color: rgb(0, 0, 0)
              });
            } catch (drawError) {
              console.error('Error al dibujar texto:', drawError);
            }
          }
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
      
      console.log('✅ PDF optimizado creado:', outputPath);
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
      console.log('✅ Fallback: PDF original copiado:', outputPath);
      return outputPath;
    }
  }
}

module.exports = new PDFProcessor();
