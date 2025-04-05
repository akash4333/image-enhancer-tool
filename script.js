document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const browseBtn = document.getElementById('browseBtn');
    const editorSection = document.getElementById('editorSection');
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    const resizeHandle = document.querySelector('.resize-handle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const qualityRange = document.getElementById('qualityRange');
    const qualityValue = document.getElementById('qualityValue');
    const brightnessRange = document.getElementById('brightnessRange');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastRange = document.getElementById('contrastRange');
    const contrastValue = document.getElementById('contrastValue');
    const sharpenToggle = document.getElementById('sharpenToggle');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    
    // Current image data
    let currentImage = null;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    
    // Initialize dark mode
    function initDarkMode() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem('ietDarkMode');
        
        if (savedMode === 'true' || (!savedMode && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.checked = true;
        }
    }
    
    // Dark mode toggle
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('ietDarkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('ietDarkMode', 'false');
        }
    });
    
    // Update range value displays
    qualityRange.addEventListener('input', function() {
        qualityValue.textContent = this.value;
        processImage();
    });
    
    brightnessRange.addEventListener('input', function() {
        brightnessValue.textContent = this.value;
        processImage();
    });
    
    contrastRange.addEventListener('input', function() {
        contrastValue.textContent = this.value;
        processImage();
    });
    
    sharpenToggle.addEventListener('change', processImage);
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        qualityRange.value = 80;
        brightnessRange.value = 0;
        contrastRange.value = 0;
        sharpenToggle.checked = false;
        
        qualityValue.textContent = '80';
        brightnessValue.textContent = '0';
        contrastValue.textContent = '0';
        
        processImage();
    });
    
    // Download button
    downloadBtn.addEventListener('click', function() {
        if (!processedImage.src || processedImage.src === '#') {
            alert('Please process an image first');
            return;
        }
        
        const link = document.createElement('a');
        link.href = processedImage.src;
        link.download = 'enhanced-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // Browse button
    browseBtn.addEventListener('click', function() {
        imageInput.click();
    });
    
    // File input change
    imageInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('active');
    }
    
    function unhighlight() {
        dropZone.classList.remove('active');
    }
    
    dropZone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });
    
    // Handle dropped/selected files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        // Show upload progress
        uploadProgress.classList.remove('d-none');
        const progressBar = uploadProgress.querySelector('.progress-bar');
        progressBar.style.width = '0%';
        
        const reader = new FileReader();
        
        reader.onloadstart = function() {
            progressBar.style.width = '30%';
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = `${percentLoaded}%`;
            }
        };
        
        reader.onload = function(e) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                uploadProgress.classList.add('d-none');
                initEditor(e.target.result);
            }, 500);
        };
        
        reader.onerror = function() {
            progressBar.style.width = '0%';
            uploadProgress.classList.add('d-none');
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }
    
    // Initialize editor with image
    function initEditor(imageData) {
        editorSection.classList.remove('d-none');
        originalImage.src = imageData;
        processedImage.src = imageData;
        currentImage = imageData;
        
        // Initialize image comparison slider
        initImageComparison();
        
        // Load image into canvas for processing
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    }
    
    // Image comparison slider
    function initImageComparison() {
        let isResizing = false;
        
        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const container = document.querySelector('.image-comparison');
            const containerRect = container.getBoundingClientRect();
            let percentage = (e.clientX - containerRect.left) / containerRect.width * 100;
            
            // Limit between 5% and 95%
            percentage = Math.max(5, Math.min(95, percentage));
            
            processedImage.style.width = `${percentage}%`;
            resizeHandle.style.left = `${percentage}%`;
        });
        
        document.addEventListener('mouseup', function() {
            isResizing = false;
        });
    }
    
    // Process image with current settings
    function processImage() {
        if (!currentImage) return;
        
        const quality = parseInt(qualityRange.value) / 100;
        const brightness = parseInt(brightnessRange.value);
        const contrast = parseInt(contrastRange.value);
        const sharpen = sharpenToggle.checked;
        
        // Show processing state
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Processing...';
        
        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(() => {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw original image
                ctx.drawImage(img, 0, 0);
                
                // Apply brightness/contrast
                if (brightness !== 0 || contrast !== 0) {
                    applyBrightnessContrast(brightness, contrast);
                }
                
                // Apply sharpening
                if (sharpen) {
                    applySharpening();
                }
                
                // Get processed image
                const processedImageData = canvas.toDataURL('image/jpeg', quality);
                processedImage.src = processedImageData;
                
                // Restore download button
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = '<i class="fas fa-download me-1"></i>Download';
            };
            img.src = currentImage;
        }, 100);
    }
    
    // Apply brightness and contrast
    function applyBrightnessContrast(brightness, contrast) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Map contrast to -255 to 255
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = data[i] + brightness;
            data[i+1] = data[i+1] + brightness;
            data[i+2] = data[i+2] + brightness;
            
            // Apply contrast
            data[i] = contrastFactor * (data[i] - 128) + 128;
            data[i+1] = contrastFactor * (data[i+1] - 128) + 128;
            data[i+2] = contrastFactor * (data[i+2] - 128) + 128;
            
            // Clamp values between 0-255
            data[i] = Math.max(0, Math.min(255, data[i]));
            data[i+1] = Math.max(0, Math.min(255, data[i+1]));
            data[i+2] = Math.max(0, Math.min(255, data[i+2]));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply sharpening effect
    function applySharpening() {
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw blurred image
        tempCtx.filter = 'blur(1px)';
        tempCtx.drawImage(canvas, 0, 0);
        tempCtx.filter = 'none';
        
        // Subtract blurred image from original (unsharp masking)
        ctx.globalCompositeOperation = 'difference';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        
        // Adjust the effect
        ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }
    
    // Initialize the app
    initDarkMode();
});
