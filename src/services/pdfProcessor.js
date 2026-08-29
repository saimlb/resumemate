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

            // Dividir el texto en líneas
            const lines = optimizedText.split('\n');
            const maxLinesPerPage = 45;
            const totalPages = Math.ceil(lines.length / maxLinesPerPage);
            let currentLine = 0;

            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                const page = doc.addPage([600, 800]);
                const { width, height } = page.getSize();

                let y = height - 50;

                // Título en la primera página
                if (pageNum === 0) {
                    page.drawText('CV OPTIMIZADO - RESUMEN ATS', {
                        x: 50,
                        y: y,
                        size: 16,
                        color: rgb(0, 0.4, 0.8)
                    });

                    page.drawLine({
                        start: { x: 50, y: y - 10 },
                        end: { x: width - 50, y: y - 10 },
                        thickness: 1,
                        color: rgb(0.8, 0.8, 0.8)
                    });

                    y -= 40;
                } else {
                    page.drawText(`Pagina ${pageNum + 1} de ${totalPages}`, {
                        x: 50,
                        y: y,
                        size: 10,
                        color: rgb(0.5, 0.5, 0.5)
                    });
                    y -= 30;
                }

                // Dibujar líneas de texto
                let lineCount = 0;
                while (lineCount < maxLinesPerPage && currentLine < lines.length) {
                    const line = lines[currentLine];
                    const cleanLine = line
                        .replace(/[^a-zA-Z0-9 .,;:()\-!?]/g, ' ')
                        .trim();

                    if (cleanLine.length > 0) {
                        const safeText = cleanLine.substring(0, 80);
                        let fontSize = 10;

                        if (cleanLine.includes('===') || cleanLine.includes('---')) {
                            fontSize = 12;
                            page.drawText(safeText, {
                                x: 50,
                                y: y,
                                size: fontSize,
                                color: rgb(0, 0.4, 0.8)
                            });
                        } else if (cleanLine.includes('RECOMENDACIONES') || cleanLine.includes('TU CV ORIGINAL')) {
                            fontSize = 12;
                            page.drawText(safeText, {
                                x: 50,
                                y: y,
                                size: fontSize,
                                color: rgb(0, 0.4, 0.8)
                            });
                        } else {
                            page.drawText(safeText, {
                                x: 50,
                                y: y,
                                size: fontSize,
                                color: rgb(0, 0, 0)
                            });
                        }

                        y -= 16;
                        lineCount++;
                    } else {
                        y -= 10;
                        lineCount++;
                    }

                    currentLine++;
                }

                // Pie de página
                page.drawText(`Generado por ResumeMate - Optimizador ATS - Pagina ${pageNum + 1} de ${totalPages}`, {
                    x: 50,
                    y: 30,
                    size: 8,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }

            const pdfBytes = await doc.save();

            const outputFilename = `optimized_${Date.now()}.pdf`;
            const outputPath = path.join(outputDir, outputFilename);
            fs.writeFileSync(outputPath, pdfBytes);

            console.log('✅ PDF optimizado creado con', totalPages, 'paginas');
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
