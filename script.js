// Función para normalizar texto (eliminar acentos y caracteres especiales)
function normalizeText(text) {
    return text
        .normalize('NFD') // Normalizar caracteres Unicode
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (acentos)
        .toLowerCase()
        .trim();
}

// Función para generar nombre de archivo basado en nombre y cargo
function generateFileName(extension) {
    try {
        const nameElement = document.querySelector('.main-name');
        const titleElement = document.querySelector('.main-title');
        
        let name = '';
        let title = '';
        
        if (nameElement) {
            const nameText = nameElement.textContent.trim();
            if (nameText) {
                name = normalizeText(nameText);
                // Reemplazar espacios y caracteres especiales con guiones
                name = name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            }
        }
        
        if (titleElement) {
            const titleText = titleElement.textContent.trim();
            if (titleText) {
                title = normalizeText(titleText);
                // Reemplazar espacios y caracteres especiales con guiones
                title = title.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            }
        }
        
        // Construir el nombre del archivo
        let fileName = 'cv';
        if (name) {
            fileName += '-' + name;
        }
        if (title) {
            fileName += '-' + title;
        }
        
        // Si no hay nombre ni título, usar nombre por defecto
        if (!name && !title) {
            fileName = 'curriculum-vitae';
        }
        
        const finalFileName = fileName + '.' + extension;
        console.log('Nombre de archivo generado:', finalFileName);
        return finalFileName;
    } catch (error) {
        console.warn('Error al generar nombre de archivo:', error);
        return 'curriculum-vitae.' + extension;
    }
}

// Función para inicializar cuando el DOM esté listo
function init() {
    initPDFDownload();
    initATSDownload();
}

// Función para inicializar la sección de repositorios
function initRepositories() {
    // Hacer las tarjetas de repositorios clicables
    const repoCards = document.querySelectorAll('.repository-card');
    repoCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // No hacer nada si se hace clic en el link del reporte
            if (e.target.closest('.repo-report-link')) {
                return;
            }
            
            const repoUrl = this.getAttribute('data-repo-url');
            if (repoUrl) {
                window.open(repoUrl, '_blank');
            }
        });
    });
}

// Esperar a que el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        init();
        initRepositories();
    });
} else {
    // DOM ya está listo
    init();
    initRepositories();
}

function initPDFDownload() {
    const pdfButton = document.getElementById('download-pdf');
    if (!pdfButton) {
        console.error('Botón de PDF no encontrado');
        return;
    }
    
    pdfButton.addEventListener('click', function() {
    const element = document.getElementById('cv-container');
    
    // Mostrar mensaje de carga
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = '⏳ Generando PDF...';
    btn.disabled = true;
    
    // Detectar si estamos en file:// protocol
    const isFileProtocol = window.location.protocol === 'file:';
    
    // Convertir todas las imágenes a base64 para evitar problemas de CORS
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
            // Si la imagen ya está en base64 o data URL, no hacer nada
            if (img.src.startsWith('data:')) {
                resolve();
                return;
            }
            
            // Obtener la ruta original del atributo src (puede ser relativa)
            const originalSrc = img.getAttribute('src') || img.src;
            
            // Si estamos en file:// protocol, simplemente ocultar la imagen
            // porque no podemos convertirla a base64 debido a restricciones de seguridad
            if (isFileProtocol) {
                console.warn('⚠️ Archivo abierto desde sistema de archivos (file://).');
                console.warn('La imagen se ocultará en el PDF debido a restricciones de seguridad del navegador.');
                console.warn('💡 Solución: Abre el archivo desde un servidor local para que la imagen aparezca en el PDF.');
                console.warn('   Ejemplo: python -m http.server (en la carpeta del proyecto)');
                img.style.display = 'none';
                resolve();
                return;
            }
            
            // Asegurar que la imagen esté completamente cargada
            const ensureImageLoaded = () => {
                if (img.complete && img.naturalWidth > 0) {
                    // Imagen ya está cargada
                    convertImageToBase64(img, originalSrc, resolve);
                } else {
                    // Esperar a que la imagen se cargue
                    const loadHandler = () => {
                        if (img.naturalWidth > 0) {
                            convertImageToBase64(img, originalSrc, resolve);
                        } else {
                            console.warn('Imagen cargada pero sin dimensiones válidas:', originalSrc);
                            img.style.display = 'none';
                            resolve();
                        }
                    };
                    const errorHandler = () => {
                        console.warn('Error al cargar la imagen:', originalSrc);
                        img.style.display = 'none';
                        resolve();
                    };
                    
                    // Remover listeners anteriores si existen
                    img.removeEventListener('load', loadHandler);
                    img.removeEventListener('error', errorHandler);
                    
                    img.addEventListener('load', loadHandler, { once: true });
                    img.addEventListener('error', errorHandler, { once: true });
                    
                    // Si la imagen no tiene src o tiene un src diferente, establecerlo
                    if (!img.src || (img.src !== originalSrc && !img.src.startsWith('data:'))) {
                        // Asegurar que la ruta sea correcta
                        img.src = originalSrc;
                    }
                    
                    // Timeout de seguridad
                    setTimeout(() => {
                        if (!img.complete) {
                            console.warn('Timeout al cargar imagen:', originalSrc);
                            img.style.display = 'none';
                            resolve();
                        }
                    }, 5000);
                }
            };
            
            ensureImageLoaded();
        });
    });
    
    // Esperar a que todas las imágenes se conviertan a base64
    Promise.all(imagePromises).then(() => {
        // Pequeño delay para asegurar que las imágenes se actualicen en el DOM
        return new Promise(resolve => setTimeout(resolve, 100));
    }).then(() => {
        // Ocultar menú de navegación y sección de repositorios antes de generar PDF
        const mainNav = document.getElementById('main-nav');
        const reposSection = document.getElementById('repositories-section');
        const mainNavDisplay = mainNav ? mainNav.style.display : '';
        const reposSectionDisplay = reposSection ? reposSection.style.display : '';
        if (mainNav) {
            mainNav.style.display = 'none';
        }
        if (reposSection) {
            reposSection.style.display = 'none';
        }
        
        // Aplicar estilos temporales para PDF (reducir tamaño de imagen y espaciado)
        const style = document.createElement('style');
        style.id = 'pdf-styles';
        style.textContent = `
            .profile-photo img {
                width: 100px !important;
                height: 100px !important;
                border: 2px solid #34495e !important;
            }
            .profile-photo {
                margin-bottom: 10px !important;
            }
            .sidebar {
                padding: 15px 15px !important;
            }
            .sidebar section {
                margin-bottom: 15px !important;
            }
            .sidebar h3 {
                margin-bottom: 10px !important;
                padding-bottom: 5px !important;
            }
            .contact-item {
                margin-bottom: 8px !important;
                font-size: 12px !important;
            }
            .education-item {
                margin-bottom: 12px !important;
            }
            .sidebar ul li {
                font-size: 11px !important;
                margin-bottom: 5px !important;
            }
            .main-nav {
                display: none !important;
            }
            .repositories-section {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Forzar reflow para aplicar estilos
        element.offsetHeight;
        
        // Generar nombre de archivo personalizado
        const fileName = generateFileName('pdf');
        console.log('Generando PDF con nombre:', fileName);
        
        const opt = {
            margin: [5, 5, 5, 5],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 1.5, 
                useCORS: false,
                allowTaint: false,
                logging: false,
                letterRendering: true,
                ignoreElements: function(element) {
                    return element.tagName === 'IMG' && element.style.display === 'none';
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        return html2pdf().set(opt).from(element).save().then(() => {
            // Remover estilos temporales después de generar el PDF
            const pdfStyles = document.getElementById('pdf-styles');
            if (pdfStyles) {
                pdfStyles.remove();
            }
            
            // Restaurar menú de navegación y sección de repositorios
            if (mainNav) {
                mainNav.style.display = mainNavDisplay || '';
            }
            if (reposSection) {
                reposSection.style.display = reposSectionDisplay || '';
            }
        });
    }).then(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }).catch((error) => {
        console.error('Error al generar PDF:', error);
        btn.textContent = originalText;
        btn.disabled = false;
        alert('Error al generar el PDF: ' + (error.message || 'Error desconocido. Por favor, verifica la consola para más detalles.'));
    });
    });
}

// Función para convertir imagen a base64
function convertImageToBase64(img, originalSrc, callback) {
    // Si ya es base64, no hacer nada
    if (img.src.startsWith('data:')) {
        callback();
        return;
    }
    
    // Detectar si estamos en file:// protocol
    const isFileProtocol = window.location.protocol === 'file:';
    
    // Si estamos en file://, usar un método especial
    if (isFileProtocol) {
        // Para file://, intentar usar FileReader directamente leyendo el archivo
        // Pero esto requiere que el usuario seleccione el archivo, así que mejor ocultamos la imagen
        // O intentamos usar el método directo con la imagen ya cargada
        try {
            // Intentar convertir directamente con la imagen del DOM
            // Esto puede funcionar si la imagen ya está en memoria
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Usar las dimensiones naturales de la imagen
            const width = img.naturalWidth || img.width || 180;
            const height = img.naturalHeight || img.height || 180;
            
            canvas.width = width;
            canvas.height = height;
            
            // Intentar dibujar la imagen
            ctx.drawImage(img, 0, 0, width, height);
            
            // Intentar obtener dataURL
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            img.src = dataURL;
            callback();
            return;
        } catch (e) {
            // Si falla, significa que el canvas está "tainted"
            // En file:// protocol, no podemos convertir imágenes locales a base64
            // La mejor solución es ocultar la imagen o usar html2canvas con allowTaint
            console.warn('No se puede convertir imagen local a base64 en file:// protocol. La imagen se ocultará en el PDF.');
            img.style.display = 'none';
            callback();
            return;
        }
    }
    
    // Para otros protocolos (http/https), usar el método normal
    // Resolver la ruta completa
    let imageSrc = originalSrc;
    if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
        try {
            const imgUrl = new URL(imageSrc, window.location.href);
            imageSrc = imgUrl.href;
        } catch (e) {
            imageSrc = originalSrc;
        }
    }
    
    // Intentar primero con canvas directamente
    try {
        if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || img.width || 180;
            canvas.height = img.naturalHeight || img.height || 180;
            
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            img.src = dataURL;
            callback();
            return;
        }
    } catch (e) {
        console.log('Método directo falló, intentando método alternativo...');
    }
    
    // Método alternativo: crear nueva imagen
    const tempImg = new Image();
    
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        tempImg.crossOrigin = 'anonymous';
    }
    
    tempImg.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
            ctx.drawImage(tempImg, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            img.src = dataURL;
            callback();
        } catch (err) {
            console.warn('Error al convertir imagen con canvas:', err);
            // Intentar con fetch
            if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
                fetch(imageSrc, { mode: 'cors' })
                    .then(response => {
                        if (!response.ok) throw new Error('No se pudo cargar');
                        return response.blob();
                    })
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                            img.src = reader.result;
                            callback();
                        };
                        reader.onerror = function() {
                            img.style.display = 'none';
                            callback();
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(() => {
                        img.style.display = 'none';
                        callback();
                    });
            } else {
                img.style.display = 'none';
                callback();
            }
        }
    };
    
    tempImg.onerror = function() {
        console.warn('Error al cargar la imagen para conversión:', imageSrc);
        img.style.display = 'none';
        callback();
    };
    
    tempImg.src = imageSrc;
}

function initATSDownload() {
    const atsButton = document.getElementById('download-ats');
    if (!atsButton) {
        console.error('Botón de ATS no encontrado');
        return;
    }
    
    atsButton.addEventListener('click', function() {
    // Crear una versión simplificada del CV para ATS
    const atsContent = generateATSVersion();
    
    // Generar nombre de archivo personalizado
    const fileName = generateFileName('txt');
    console.log('Generando ATS con nombre:', fileName);
    
    // Crear blob y descargar
    const blob = new Blob([atsContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    console.log('Atributo download establecido en:', a.download);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    });
}

function generateATSVersion() {
    // Extraer información del DOM
    const name = document.querySelector('.main-name').textContent.trim();
    const title = document.querySelector('.main-title').textContent.trim();
    
    // Contacto
    const contactItems = Array.from(document.querySelectorAll('.contact-item'));
    const contact = contactItems.map(item => {
        // Si tiene un enlace, incluir el texto del enlace y la URL
        const link = item.querySelector('.contact-link');
        if (link) {
            const linkText = link.textContent.trim();
            const linkUrl = link.getAttribute('href') || '';
            return item.querySelector('.icon').textContent.trim() + ' ' + linkText + (linkUrl ? ' - ' + linkUrl : '');
        }
        // Si no tiene enlace, solo el texto sin emojis
        const text = item.textContent.trim();
        return text.replace(/[📞✉️📍💼💻]/g, '').trim();
    }).join('\n');
    
    // Educación
    const educationItems = Array.from(document.querySelectorAll('.education-item'));
    const education = educationItems.map(item => {
        const date = item.querySelector('.date')?.textContent.trim() || '';
        const title = item.querySelector('h4')?.textContent.trim() || '';
        const description = item.querySelector('p')?.textContent.trim() || '';
        return `${date} - ${title} - ${description}`;
    }).join('\n');
    
    // Habilidades
    let skills = '';
    
    // Hard Skills
    const hardSkillsCategories = Array.from(document.querySelectorAll('.skill-category'));
    const hardSkills = hardSkillsCategories.map(category => {
        const categoryName = category.querySelector('.category-name')?.textContent.trim() || '';
        const categoryItems = category.querySelector('.category-items')?.textContent.trim() || '';
        return categoryName + ' ' + categoryItems;
    }).join('; ');
    
    // Soft Skills
    const softSkillsText = document.querySelector('.soft-skills-text')?.textContent.trim() || '';
    
    if (hardSkills) {
        skills = 'Hard Skills: ' + hardSkills;
    }
    if (softSkillsText) {
        skills += (hardSkills ? ' | ' : '') + 'Soft Skills: ' + softSkillsText;
    }
    
    if (!skills) {
        // Fallback si no encuentra la nueva estructura
        const oldSkills = Array.from(document.querySelectorAll('.skills li'))
            .map(li => li.textContent.trim())
            .join(', ');
        skills = oldSkills;
    }
    
    // Idiomas
    const languages = Array.from(document.querySelectorAll('.languages li'))
        .map(li => li.textContent.trim())
        .join(', ');
    
    // Perfil
    const profile = document.querySelector('.profile p')?.textContent.trim() || '';
    
    // Experiencia
    const experiences = Array.from(document.querySelectorAll('.experience-item'));
    const experienceText = experiences.map(exp => {
        const header = exp.querySelector('.experience-header');
        const company = header?.querySelector('h3')?.textContent.trim() || '';
        const role = header?.querySelector('.role')?.textContent.trim() || '';
        const date = exp.querySelector('.date-range')?.textContent.trim() || '';
        const description = exp.querySelector('p')?.textContent.trim() || '';
        const bullets = Array.from(exp.querySelectorAll('ul li'))
            .map(li => '  • ' + li.textContent.trim())
            .join('\n');
        
        return `${role} - ${company}\n${date}\n${description}\n${bullets}`;
    }).join('\n\n');
    
    // Proyectos
    const projects = Array.from(document.querySelectorAll('.project-item'));
    const projectsText = projects.map(proj => {
        const header = proj.querySelector('.project-header');
        const title = header?.querySelector('h3')?.textContent.trim() || '';
        const date = header?.querySelector('.project-date')?.textContent.trim() || '';
        const description = proj.querySelector('p')?.textContent.trim() || '';
        const bullets = Array.from(proj.querySelectorAll('ul li'))
            .map(li => '  • ' + li.textContent.trim())
            .join('\n');
        
        return `${title} (${date})\n${description}\n${bullets}`;
    }).join('\n\n');
    
    // Construir texto ATS
    let atsText = `${name}\n${title}\n\n`;
    atsText += `CONTACTO\n${contact}\n\n`;
    atsText += `EDUCACIÓN\n${education}\n\n`;
    atsText += `HABILIDADES\n${skills}\n\n`;
    atsText += `IDIOMAS\n${languages}\n\n`;
    atsText += `PERFIL\n${profile}\n\n`;
    atsText += `EXPERIENCIA LABORAL\n${experienceText}\n\n`;
    
    // Certificaciones
    const certifications = Array.from(document.querySelectorAll('.certification-item'));
    const certificationsText = certifications.map(cert => {
        const institution = cert.querySelector('.certification-institution')?.textContent.trim() || '';
        const title = cert.querySelector('.certification-title')?.textContent.trim() || '';
        const date = cert.querySelector('.certification-date')?.textContent.trim() || '';
        return `${institution}\n${title}\n${date}`;
    }).join('\n\n');
    
    if (certificationsText) {
        atsText += `CERTIFICACIONES\n${certificationsText}\n\n`;
    }
    
    atsText += `PROYECTOS\n${projectsText}\n`;
    
    return atsText;
}

