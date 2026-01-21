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

// Función para mostrar/ocultar botones de generación
// Llama a esta función desde la consola del navegador cuando necesites regenerar los archivos
// Ejemplo: showGenerateButtons() o hideGenerateButtons()
function showGenerateButtons() {
    const generateButtons = document.getElementById('generate-buttons');
    if (generateButtons) {
        generateButtons.style.display = 'flex';
        console.log('✅ Botones de generación habilitados');
    }
}

function hideGenerateButtons() {
    const generateButtons = document.getElementById('generate-buttons');
    if (generateButtons) {
        generateButtons.style.display = 'none';
        console.log('✅ Botones de generación ocultos');
    }
}

// Función para inicializar cuando el DOM esté listo
function init() {
    initPDFDownload(); // Descarga archivo estático
    initATSDownload(); // Descarga archivo estático
    initPDFGenerate(); // Genera nuevo PDF
    initATSGenerate(); // Genera nuevo ATS
    
    // Los botones de generación están ocultos por defecto
    // Usa showGenerateButtons() en la consola para mostrarlos cuando necesites regenerar
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

// Función para descargar PDF estático
function initPDFDownload() {
    const pdfButton = document.getElementById('download-pdf');
    if (!pdfButton) {
        console.error('Botón de PDF no encontrado');
        return;
    }
    
    pdfButton.addEventListener('click', function() {
        // Generar nombre de archivo basado en el CV actual
        const fileName = generateFileName('pdf');
        
        // Intentar descargar el archivo estático
        // Si no existe, mostrar mensaje
        const link = document.createElement('a');
        link.href = fileName; // Ruta al archivo estático
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Intentar descargar
        link.click();
        
        // Si falla, el navegador mostrará un error 404
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    });
}

// Función para generar nuevo PDF
function initPDFGenerate() {
    const generateButton = document.getElementById('generate-pdf');
    if (!generateButton) {
        return; // Botón no existe, no hacer nada
    }
    
    generateButton.addEventListener('click', function() {
        const element = document.getElementById('cv-container');
        
        if (!element) {
            console.error('Elemento cv-container no encontrado');
            alert('Error: No se encontró el contenido del CV');
            return;
        }
        
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
        
        // Aplicar estilos temporales para PDF - Forzar versión de escritorio
        const style = document.createElement('style');
        style.id = 'pdf-styles';
        style.textContent = `
            /* Ocultar elementos que no deben aparecer en PDF */
            .main-nav {
                display: none !important;
            }
            .repositories-section {
                display: none !important;
            }
            
            /* Forzar estilos de escritorio - ignorar media queries */
            body {
                padding: 20px !important;
                padding-top: 20px !important;
            }
            
            .container {
                max-width: 1000px !important;
                margin: 0 auto !important;
                box-shadow: 0 0 20px rgba(0,0,0,0.1) !important;
            }
            
            .top-contact {
                padding: 10px 20px !important;
                font-size: 11px !important;
                gap: 15px !important;
                flex-wrap: nowrap !important;
                flex-direction: row !important;
                justify-content: center !important;
                align-items: center !important;
                overflow-x: auto !important;
            }
            
            .contact-item-inline {
                flex-shrink: 0 !important;
                flex: 0 1 auto !important;
                min-width: 0 !important;
                max-width: none !important;
                width: auto !important;
            }
            
            .contact-item-inline span {
                white-space: nowrap !important;
                word-break: normal !important;
                overflow-wrap: normal !important;
                max-width: 200px !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }
            
            .main-content {
                padding: 20px 30px !important;
            }
            
            .header-info {
                text-align: center !important;
                margin-bottom: 15px !important;
                padding-bottom: 10px !important;
            }
            
            .main-name {
                font-size: 28px !important;
                margin-bottom: 4px !important;
            }
            
            .main-title {
                font-size: 16px !important;
            }
            
            .main-content h2 {
                font-size: 18px !important;
                margin-bottom: 12px !important;
                padding-bottom: 6px !important;
            }
            
            .main-content section {
                margin-bottom: 15px !important;
                page-break-inside: auto !important;
                break-inside: auto !important;
            }
            
            .main-content h2 {
                page-break-after: avoid !important;
                break-after: avoid !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .experience-item,
            .project-item {
                page-break-inside: auto !important;
                break-inside: auto !important;
                page-break-after: auto !important;
            }
            
            .experience-header,
            .project-header {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .date-range,
            .project-date {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
            
            .profile p {
                font-size: 13px !important;
                line-height: 1.6 !important;
            }
            
            .experience-item,
            .project-item,
            .certification-item {
                margin-bottom: 15px !important;
                padding-bottom: 12px !important;
            }
            
            .experience-header h3,
            .project-header h3 {
                font-size: 16px !important;
            }
            
            .date-range,
            .project-date {
                font-size: 12px !important;
            }
            
            .experience-item p,
            .project-item p {
                font-size: 13px !important;
                margin-bottom: 8px !important;
                line-height: 1.5 !important;
            }
            
            .experience-item ul,
            .project-item ul {
                margin-top: 6px !important;
                margin-bottom: 0 !important;
            }
            
            .experience-item ul li,
            .project-item ul li {
                font-size: 12px !important;
                margin-bottom: 4px !important;
            }
            
            .projects-within-experience {
                margin-top: 12px !important;
                padding-top: 12px !important;
                border-top: 1px solid #ecf0f1 !important;
            }
            
            .projects-subtitle {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #3498db !important;
                margin-bottom: 10px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .projects-within-experience .project-item {
                margin-bottom: 12px !important;
                padding-bottom: 10px !important;
                padding-left: 12px !important;
                border-left: 2px solid #3498db !important;
            }
            
            .projects-within-experience .project-item:last-child {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
            }
            
            .projects-within-experience .project-header h3 {
                font-size: 15px !important;
            }
            
            .projects-within-experience .project-item p {
                font-size: 12px !important;
                margin-bottom: 6px !important;
            }
            
            .compact-section {
                margin-top: 10px !important;
            }
            
            .compact-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 20px !important;
            }
            
            .compact-column h2 {
                font-size: 16px !important;
                margin-bottom: 10px !important;
                padding-bottom: 5px !important;
            }
            
            .certification-item-compact {
                margin-bottom: 10px !important;
                padding-bottom: 8px !important;
            }
            
            .cert-institution-compact {
                font-size: 12px !important;
            }
            
            .cert-title-compact {
                font-size: 11px !important;
                line-height: 1.4 !important;
            }
            
            .cert-date-compact {
                font-size: 10px !important;
            }
            
            .skills-subtitle-compact {
                font-size: 12px !important;
                margin-top: 10px !important;
                margin-bottom: 6px !important;
            }
            
            .skill-category-compact {
                font-size: 11px !important;
                margin-bottom: 5px !important;
                line-height: 1.4 !important;
            }
            
            .soft-skills-text-compact {
                font-size: 11px !important;
                line-height: 1.5 !important;
            }
            
            .education-item-compact {
                font-size: 11px !important;
                line-height: 1.5 !important;
            }
            
            .languages-compact p {
                font-size: 11px !important;
            }
            
            .download-buttons {
                display: none !important;
            }
            
            /* Asegurar que los media queries no se apliquen - forzar siempre versión escritorio */
            @media (max-width: 768px) {
                .main-content {
                    padding: 20px 30px !important;
                }
                .top-contact {
                    padding: 8px 15px !important;
                    font-size: 9px !important;
                    flex-wrap: nowrap !important;
                    flex-direction: row !important;
                }
                .contact-item-inline {
                    flex: 0 1 auto !important;
                    width: auto !important;
                }
            }
            
            @media (max-width: 480px) {
                .main-content {
                    padding: 20px 30px !important;
                }
                .top-contact {
                    padding: 8px 15px !important;
                    font-size: 9px !important;
                    flex-wrap: nowrap !important;
                    flex-direction: row !important;
                }
                .contact-item-inline {
                    flex: 0 1 auto !important;
                    width: auto !important;
                }
            }
            
            .experience-item,
            .project-item,
            .certification-item {
                margin-bottom: 15px !important;
                padding-bottom: 12px !important;
            }
            
            .experience-header h3,
            .project-header h3 {
                font-size: 16px !important;
            }
            
            .date-range,
            .project-date {
                font-size: 12px !important;
                margin-bottom: 8px !important;
            }
            
            .experience-item p,
            .project-item p {
                font-size: 13px !important;
                margin-bottom: 8px !important;
                line-height: 1.5 !important;
            }
            
            .experience-item ul,
            .project-item ul {
                margin-top: 6px !important;
                margin-bottom: 0 !important;
            }
            
            .experience-item ul li,
            .project-item ul li {
                font-size: 12px !important;
                margin-bottom: 4px !important;
            }
            
            .projects-within-experience {
                margin-top: 12px !important;
                padding-top: 12px !important;
                border-top: 1px solid #ecf0f1 !important;
            }
            
            .projects-subtitle {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #3498db !important;
                margin-bottom: 10px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .projects-within-experience .project-item {
                margin-bottom: 12px !important;
                padding-bottom: 10px !important;
                padding-left: 12px !important;
                border-left: 2px solid #3498db !important;
            }
            
            .projects-within-experience .project-item:last-child {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
            }
            
            .projects-within-experience .project-header h3 {
                font-size: 15px !important;
            }
            
            .projects-within-experience .project-item p {
                font-size: 12px !important;
                margin-bottom: 6px !important;
            }
            
            .compact-section {
                margin-top: 10px !important;
            }
            
            .compact-grid {
                gap: 20px !important;
            }
            
            .compact-column h2 {
                font-size: 16px !important;
                margin-bottom: 10px !important;
                padding-bottom: 5px !important;
            }
            
            .certification-item-compact {
                margin-bottom: 10px !important;
                padding-bottom: 8px !important;
            }
            
            .cert-institution-compact {
                font-size: 12px !important;
            }
            
            .cert-title-compact {
                font-size: 11px !important;
                line-height: 1.4 !important;
            }
            
            .cert-date-compact {
                font-size: 10px !important;
            }
            
            .skills-subtitle-compact {
                font-size: 12px !important;
                margin-top: 10px !important;
                margin-bottom: 6px !important;
            }
            
            .skill-category-compact {
                font-size: 11px !important;
                margin-bottom: 5px !important;
                line-height: 1.4 !important;
            }
            
            .soft-skills-text-compact {
                font-size: 11px !important;
                line-height: 1.5 !important;
            }
            
            .education-item-compact {
                font-size: 11px !important;
                line-height: 1.5 !important;
            }
            
            .languages-compact p {
                font-size: 11px !important;
            }
            
            .download-buttons {
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
            margin: [3, 3, 3, 3],
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
            pagebreak: { 
                mode: ['css', 'legacy'], 
                avoid: ['.experience-header', '.project-header', 'h2', 'h3', '.date-range', '.project-date']
            }
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
        // Generar nombre de archivo basado en el CV actual
        const fileName = generateFileName('txt');
        
        // Intentar descargar el archivo estático
        const link = document.createElement('a');
        link.href = fileName; // Ruta al archivo estático
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Intentar descargar
        link.click();
        
        // Si falla, el navegador mostrará un error 404
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    });
}

// Función para generar nuevo ATS
function initATSGenerate() {
    const generateButton = document.getElementById('generate-ats');
    if (!generateButton) {
        return; // Botón no existe, no hacer nada
    }
    
    generateButton.addEventListener('click', function() {
        try {
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
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al generar ATS:', error);
            alert('Error al generar el ATS: ' + (error.message || 'Error desconocido'));
        }
    });
}

// Función auxiliar para limpiar y normalizar texto
function cleanText(text) {
    if (!text) return '';
    return text
        .split('\n') // Dividir por líneas
        .map(line => line.trim()) // Eliminar espacios al inicio y final de cada línea
        .filter(line => line.length > 0) // Eliminar líneas vacías
        .join(' ') // Unir con un solo espacio
        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
        .trim(); // Eliminar espacios al inicio y final
}

function generateATSVersion() {
    // Extraer información del DOM
    const name = document.querySelector('.main-name').textContent.trim();
    const title = document.querySelector('.main-title').textContent.trim();
    
    // Contacto (nueva estructura con contact-item-inline)
    let contact = '';
    const contactItemsInline = Array.from(document.querySelectorAll('.contact-item-inline'));
    if (contactItemsInline.length > 0) {
        contact = contactItemsInline.map(item => {
            const text = item.textContent.trim();
            return text.replace(/[📞✉️📍💼💻]/g, '').trim();
        }).join(' | ');
    } else {
        // Fallback a estructura antigua
        const contactItems = Array.from(document.querySelectorAll('.contact-item'));
        contact = contactItems.map(item => {
            const link = item.querySelector('.contact-link');
            if (link) {
                const linkText = link.textContent.trim();
                const linkUrl = link.getAttribute('href') || '';
                return item.querySelector('.icon').textContent.trim() + ' ' + linkText + (linkUrl ? ' - ' + linkUrl : '');
            }
            const text = item.textContent.trim();
            return text.replace(/[📞✉️📍💼💻]/g, '').trim();
        }).join('\n');
    }
    
    // Perfil
    const profile = cleanText(document.querySelector('.profile p')?.textContent || '');
    
    // Experiencia
    const experiences = Array.from(document.querySelectorAll('.experience-item'));
    const experienceText = experiences.map(exp => {
        const header = exp.querySelector('.experience-header');
        const company = header?.querySelector('h3')?.textContent.trim() || '';
        const role = header?.querySelector('.role')?.textContent.trim() || '';
        const date = exp.querySelector('.date-range')?.textContent.trim() || '';
        const description = cleanText(exp.querySelector('p')?.textContent || '');
        const bullets = Array.from(exp.querySelectorAll('ul li'))
            .map(li => '  • ' + li.textContent.trim())
            .join('\n');
        
        // Buscar proyectos dentro de esta experiencia
        const projectsWithin = exp.querySelectorAll('.projects-within-experience .project-item');
        let projectsSection = '';
        if (projectsWithin.length > 0) {
            projectsSection = '\n\nProyectos destacados:\n';
            projectsSection += Array.from(projectsWithin).map(proj => {
                const projHeader = proj.querySelector('.project-header');
                const projTitle = projHeader?.querySelector('h3')?.textContent.trim() || '';
                const projDate = projHeader?.querySelector('.project-date')?.textContent.trim() || '';
                const projDescription = cleanText(proj.querySelector('p')?.textContent || '');
                const projBullets = Array.from(proj.querySelectorAll('ul li'))
                    .map(li => '  • ' + li.textContent.trim())
                    .join('\n');
                return `  ${projTitle} (${projDate})\n  ${projDescription}${projBullets ? '\n' + projBullets : ''}`;
            }).join('\n\n');
        }
        
        return `${role} - ${company}\n${date}\n${description}\n${bullets}${projectsSection}`;
    }).join('\n\n');
    
    // Proyectos (solo los que no están dentro de experiencia, por compatibilidad)
    const projects = Array.from(document.querySelectorAll('.projects .project-item'));
    const projectsText = projects.length > 0 ? projects.map(proj => {
        const header = proj.querySelector('.project-header');
        const title = header?.querySelector('h3')?.textContent.trim() || '';
        const date = header?.querySelector('.project-date')?.textContent.trim() || '';
        const description = cleanText(proj.querySelector('p')?.textContent || '');
        const bullets = Array.from(proj.querySelectorAll('ul li'))
            .map(li => '  • ' + li.textContent.trim())
            .join('\n');
        
        return `${title} (${date})\n${description}\n${bullets}`;
    }).join('\n\n') : '';
    
    // Certificaciones (nueva estructura compacta)
    const certifications = Array.from(document.querySelectorAll('.certification-item-compact'));
    const certificationsText = certifications.map(cert => {
        const institution = cert.querySelector('.cert-institution-compact')?.textContent.trim() || '';
        const title = cleanText(cert.querySelector('.cert-title-compact')?.textContent || '');
        const date = cert.querySelector('.cert-date-compact')?.textContent.trim() || '';
        return `${institution}\n${title}\n${date}`;
    }).join('\n\n');
    
    // Educación (intentar nueva estructura compacta primero)
    let education = '';
    const educationItemCompact = document.querySelector('.education-item-compact');
    if (educationItemCompact) {
        education = cleanText(educationItemCompact.textContent || '');
    } else {
        // Fallback a estructura antigua
        const educationItems = Array.from(document.querySelectorAll('.education-item'));
        education = educationItems.map(item => {
            const date = item.querySelector('.date')?.textContent.trim() || '';
            const title = item.querySelector('h3')?.textContent.trim() || item.querySelector('h4')?.textContent.trim() || '';
            const description = item.querySelector('p')?.textContent.trim() || '';
            const note = item.querySelector('.education-note')?.textContent.trim() || '';
            let result = title;
            if (description) result += ' - ' + description;
            if (note) result += ' - ' + note;
            if (date) result = date + ' - ' + result;
            return result;
        }).join('\n');
    }
    
    // Habilidades (nueva estructura compacta)
    let skills = '';
    
    // Hard Skills (intentar nueva estructura primero, luego fallback a antigua)
    let hardSkills = '';
    const hardSkillsCategoriesCompact = Array.from(document.querySelectorAll('.skill-category-compact'));
    if (hardSkillsCategoriesCompact.length > 0) {
        hardSkills = hardSkillsCategoriesCompact.map(category => {
            return cleanText(category.textContent || '');
        }).join('; ');
    } else {
        // Fallback a estructura antigua
        const hardSkillsCategories = Array.from(document.querySelectorAll('.skill-category'));
        hardSkills = hardSkillsCategories.map(category => {
            const categoryName = category.querySelector('.category-name')?.textContent.trim() || '';
            const categoryItems = cleanText(category.querySelector('.category-items')?.textContent || '');
            return categoryName + ' ' + categoryItems;
        }).join('; ');
    }
    
    // Soft Skills (intentar nueva estructura primero)
    let softSkillsText = '';
    const softSkillsTextCompact = document.querySelector('.soft-skills-text-compact')?.textContent;
    if (softSkillsTextCompact) {
        softSkillsText = cleanText(softSkillsTextCompact);
    } else {
        softSkillsText = cleanText(document.querySelector('.soft-skills-text')?.textContent || '');
    }
    
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
    
    // Idiomas (intentar nueva estructura compacta primero)
    let languages = '';
    const languagesCompact = document.querySelector('.languages-compact p')?.textContent.trim();
    if (languagesCompact) {
        languages = languagesCompact;
    } else {
        // Fallback a estructura antigua
        const languagesList = Array.from(document.querySelectorAll('.languages li'));
        languages = languagesList.map(li => li.textContent.trim()).join(', ');
    }
    
    // Construir texto ATS en el orden correcto del CV:
    // 1. Contacto, 2. Nombre/Título, 3. Perfil, 4. Experiencia, 5. Proyectos, 6. Certificaciones, 7. Habilidades, 8. Educación, 9. Idiomas
    let atsText = `CONTACTO\n${contact}\n\n`;
    atsText += `${name}\n${title}\n\n`;
    atsText += `PERFIL\n${profile}\n\n`;
    atsText += `EXPERIENCIA LABORAL\n${experienceText}\n\n`;
    if (projectsText) {
        atsText += `PROYECTOS\n${projectsText}\n\n`;
    }
    
    if (certificationsText) {
        atsText += `CERTIFICACIONES\n${certificationsText}\n\n`;
    }
    
    atsText += `HABILIDADES\n${skills}\n\n`;
    atsText += `EDUCACIÓN\n${education}\n\n`;
    atsText += `IDIOMAS\n${languages}\n`;
    
    return atsText;
}

