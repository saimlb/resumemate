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

      // ============================================
      // LIMPIEZA COMPLETA DEL TEXTO
      // ============================================
      // 1. Eliminar TODOS los emojis (rango Unicode de emojis)
      // 2. Eliminar caracteres no ASCII
      // 3. Eliminar caracteres especiales que pdf-lib no soporta
      
      let cleanText = optimizedText
        // Eliminar emojis (rango 0x1F000 - 0x1FFFF)
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        // Eliminar otros caracteres no ASCII
        .replace(/[^\x00-\x7F]/g, '')
        // Eliminar símbolos comunes que causan problemas
        .replace(/[→←↑↓✓✔✗✘⚠️❌✅]/g, '')
        // Reemplazar guiones largos
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        // Reemplazar comillas curvas
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Reemplazar espacios múltiples por uno solo
        .replace(/\s+/g, ' ')
        .trim();

      // Dividir en líneas
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
          
          // Limitar longitud de línea a 70 caracteres
          const textLine = trimmedLine.substring(0, 70);
          try {
            page.drawText(textLine, {
              x: 50,
              y: y,
              size: size,
              color: trimmedLine.includes('RECOMENDACIONES') || trimmedLine.includes('OPTIMIZADO') 
                ? rgb(0, 0.5, 0) 
                : rgb(0, 0, 0)
            });
          } catch (drawError) {
            // Si falla, intentar con texto aún más limpio
            const saferText = textLine.replace(/[^a-zA-Z0-9 .,;:()\-]/g, '');
            page.drawText(saferText, {
              x: 50,
              y: y,
              size: size,
              color: rgb(0, 0, 0)
            });
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
