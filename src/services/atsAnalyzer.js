class ATSAnalyzer {
  analyze(text) {
    const issues = [];
    const suggestions = [];
    let score = 70;
    let details = {};

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200) {
      issues.push('Tu CV es demasiado corto (menos de 200 palabras).');
      suggestions.push('Amplia tu experiencia laboral con mas detalles y logros.');
      score -= 10;
    } else if (wordCount > 800) {
      issues.push('Tu CV es muy extenso.');
      suggestions.push('Reduce tu CV a 1-2 paginas.');
      score -= 5;
    } else {
      suggestions.push('La extension de tu CV es adecuada.');
      score += 5;
    }

    const sections = ['experiencia', 'educación', 'habilidades', 'formación', 'trabajo', 'estudios'];
    const hasExperience = sections.some(s => text.toLowerCase().includes(s));
    
    if (!hasExperience) {
      issues.push('No se detecta una seccion clara de "Experiencia Laboral".');
      suggestions.push('Anade una seccion especifica de "Experiencia Laboral".');
      score -= 15;
    } else {
      score += 5;
    }

    const hardSkills = ['python', 'java', 'javascript', 'sql', 'html', 'css', 'excel', 'power bi', 'tableau', 'aws', 'cloud', 'machine learning', 'react', 'angular', 'vue', 'node', 'docker', 'kubernetes', 'git'];
    const foundHardSkills = hardSkills.filter(skill => text.toLowerCase().includes(skill));
    
    if (foundHardSkills.length < 3) {
      issues.push('Pocas habilidades tecnicas identificadas.');
      suggestions.push('Incluye mas habilidades tecnicas especificas.');
      score -= 10;
    } else {
      suggestions.push(`Buen numero de hard skills detectadas (${foundHardSkills.length}).`);
      score += 5;
    }

    const softSkills = ['liderazgo', 'comunicación', 'trabajo en equipo', 'resolución de problemas', 'gestión del tiempo', 'organización', 'adaptabilidad', 'creatividad'];
    const foundSoftSkills = softSkills.filter(skill => text.toLowerCase().includes(skill));
    
    if (foundSoftSkills.length < 2) {
      issues.push('Pocas habilidades blandas mencionadas.');
      suggestions.push('Anade habilidades blandas clave.');
      score -= 8;
    } else {
      suggestions.push(`Buen nivel de soft skills (${foundSoftSkills.length} detectadas).`);
    }

    const hasNumbers = /\d+%|\d+\s*€|\d+\s*dólares|\d+\s*millones|\d+\s*miembros|\d+\s*clientes/.test(text);
    if (!hasNumbers) {
      issues.push('Faltan logros cuantificables.');
      suggestions.push('Cuantifica tus logros con numeros y porcentajes.');
      score -= 12;
    } else {
      suggestions.push('Buen uso de metricas y numeros.');
      score += 8;
    }

    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    const hasPhone = /\+\d{1,3}\s?\d{9,11}|\d{9,11}/.test(text);
    
    if (!hasEmail) {
      issues.push('No se detecta email de contacto.');
      suggestions.push('Incluye tu email en la cabecera del CV.');
      score -= 5;
    }
    if (!hasPhone) {
      issues.push('No se detecta numero de telefono.');
      suggestions.push('Incluye tu telefono con prefijo internacional.');
      score -= 5;
    }

    const keywords = ['responsable', 'logros', 'resultados', 'implementé', 'desarrollé', 'dirigí', 'gestioné', 'optimicé', 'mejoré', 'aumenté', 'reduje'];
    const foundKeywords = keywords.filter(kw => text.toLowerCase().includes(kw));
    
    if (foundKeywords.length < 5) {
      issues.push('Pocas palabras clave de accion.');
      suggestions.push('Usa verbos de accion como "Implemente", "Optimice", "Lidere".');
      score -= 8;
    } else {
      suggestions.push(`Buen uso de verbos de accion (${foundKeywords.length} detectados).`);
      score += 5;
    }

    score = Math.max(0, Math.min(100, score));
    const finalSuggestions = suggestions.filter((v, i, a) => a.indexOf(v) === i);
    
    details = {
      wordCount,
      hardSkills: foundHardSkills,
      softSkills: foundSoftSkills,
      keywords: foundKeywords,
      sections: {
        experience: hasExperience
      }
    };

    return {
      score,
      issues,
      suggestions: finalSuggestions,
      details
    };
  }

  generateOptimizedText(originalText, suggestions) {
    // Limpiar sugerencias (eliminar emojis)
    const cleanSuggestions = suggestions.map(s => 
        s.replace(/[📄📊📝✅❌⚠️🔑💰🎯💡⚡🏆🔍🧠🤝⭐📋📈📬📞📱✂️🔧💻🛠️💪]/g, '').trim()
    );
    
    // Construir el texto optimizado
    let optimized = '========================================\n';
    optimized += '   CV OPTIMIZADO - RESUMEN ATS\n';
    optimized += '========================================\n\n';
    
    optimized += 'RECOMENDACIONES PARA MEJORAR TU CV:\n';
    optimized += '----------------------------------------\n';
    cleanSuggestions.forEach((s, i) => {
        optimized += `${i + 1}. ${s}\n`;
    });
    
    optimized += '\n\n';
    optimized += '========================================\n';
    optimized += '   TU CV ORIGINAL\n';
    optimized += '========================================\n\n';
    optimized += originalText;
    
    return optimized;
  }
}

module.exports = new ATSAnalyzer();
