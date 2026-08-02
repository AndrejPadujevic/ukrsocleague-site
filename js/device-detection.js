/**
 * Device Detection System for Ukrainian Socialist League
 * Detects device type (mobile, tablet, desktop) and applies appropriate styling
 */

// Device Detection Function
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                   (width <= 768 && touchSupported) || 
                   (width <= 480);
    
    // Check if this is a tablet device
    const isTablet = (/iPad|Android|Tablet|Silk/i.test(userAgent) && !isMobile) || 
                    (width > 768 && width <= 1024 && touchSupported) ||
                    (width > 480 && width <= 1024 && (height > 600));
    
    // Check if this is a desktop device
    const isDesktop = !isMobile && !isTablet;
    
    // Check screen orientation
    const isPortrait = height > width;
    const isLandscape = width > height;
    
    // Check if this is a touch device
    const isTouch = touchSupported;
    
    // Check for high DPI/retina displays
    const isRetina = window.devicePixelRatio > 1.5;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Check connection speed (if available)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false;
    
    // Return device information
    return {
        type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isMobile: isMobile,
        isTablet: isTablet,
        isDesktop: isDesktop,
        isTouch: isTouch,
        isRetina: isRetina,
        isPortrait: isPortrait,
        isLandscape: isLandscape,
        prefersReducedMotion: prefersReducedMotion,
        prefersDarkMode: prefersDarkMode,
        isSlowConnection: isSlowConnection,
        width: width,
        height: height,
        userAgent: userAgent
    };
}

// Apply device-specific classes and settings
function applyDeviceSettings() {
    const device = detectDevice();
    const html = document.documentElement;
    const body = document.body;
    
    // Add device type classes to body
    if (device.isMobile) {
        body.classList.add('device-mobile');
        body.classList.remove('device-tablet', 'device-desktop');
    } else if (device.isTablet) {
        body.classList.add('device-tablet');
        body.classList.remove('device-mobile', 'device-desktop');
    } else {
        body.classList.add('device-desktop');
        body.classList.remove('device-mobile', 'device-tablet');
    }
    
    // Add additional feature classes
    if (device.isTouch) {
        body.classList.add('touch-device');
    } else {
        body.classList.remove('touch-device');
    }
    
    if (device.isRetina) {
        body.classList.add('retina-display');
    } else {
        body.classList.remove('retina-display');
    }
    
    if (device.isPortrait) {
        body.classList.add('portrait-mode');
        body.classList.remove('landscape-mode');
    } else {
        body.classList.add('landscape-mode');
        body.classList.remove('portrait-mode');
    }
    
    if (device.prefersReducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }
    
    if (device.prefersDarkMode) {
        body.classList.add('dark-mode-preferred');
    } else {
        body.classList.remove('dark-mode-preferred');
    }
    
    if (device.isSlowConnection) {
        body.classList.add('slow-connection');
    } else {
        body.classList.remove('slow-connection');
    }
    
    // Store device info in data attributes for CSS/JS access
    body.setAttribute('data-device-type', device.type);
    body.setAttribute('data-device-width', device.width);
    body.setAttribute('data-device-height', device.height);
    
    // Apply device-specific optimizations
    applyDeviceOptimizations(device);
    
    // Log device info for debugging (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Device Detection:', device);
    }
}

// Apply device-specific optimizations
function applyDeviceOptimizations(device) {
    // Mobile-specific optimizations
    if (device.isMobile) {
        // Optimize images for mobile
        optimizeImagesForMobile();
        
        // Enable mobile-specific features
        enableMobileFeatures();
    }
    
    // Tablet-specific optimizations
    if (device.isTablet) {
        // Optimize images for tablet
        optimizeImagesForTablet();
    }
    
    // Desktop-specific optimizations
    if (device.isDesktop) {
        // Desktop-specific features are handled by CSS
    }
    
    // Touch device optimizations
    if (device.isTouch) {
        // Touch features are handled by CSS
    }
    
    // Reduced motion optimizations
    if (device.prefersReducedMotion) {
        // Handled by CSS
    }
    
    // Slow connection optimizations
    if (device.isSlowConnection) {
        optimizeForSlowConnection();
    }
}

// Mobile-specific optimizations
function optimizeImagesForMobile() {
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
        if (!img.complete || img.offsetHeight === 0) {
            img.setAttribute('loading', 'lazy');
        }
    });
}

function enableMobileFeatures() {
    // Mobile-specific features are handled by CSS
}

// Tablet-specific optimizations
function optimizeImagesForTablet() {
    // Load medium-quality images for tablets
    const images = document.querySelectorAll('img[data-src-medium]');
    images.forEach(img => {
        const mediumSrc = img.getAttribute('data-src-medium');
        if (mediumSrc && !img.complete) {
            img.setAttribute('src', mediumSrc);
        }
    });
}

// Slow connection optimizations
function optimizeForSlowConnection() {
    // Disable heavy animations and effects
    const style = document.createElement('style');
    style.textContent = `
        .slow-connection .decorative-elements {
            display: none !important;
        }
        .slow-connection .gear,
        .slow-connection .red-star {
            animation: none !important;
            opacity: 0 !important;
        }
        .slow-connection img {
            loading: lazy !important;
        }
    `;
    document.head.appendChild(style);
    
    // Preload critical resources only
    const criticalImages = document.querySelectorAll('img[loading="eager"]');
    criticalImages.forEach(img => {
        if (!img.complete) {
            img.setAttribute('loading', 'lazy');
        }
    });
}

// Handle window resize
function handleResize() {
    const device = detectDevice();
    
    // Update body classes on resize
    if (device.isMobile) {
        document.body.classList.add('device-mobile');
        document.body.classList.remove('device-tablet', 'device-desktop');
    } else if (device.isTablet) {
        document.body.classList.add('device-tablet');
        document.body.classList.remove('device-mobile', 'device-desktop');
    } else {
        document.body.classList.add('device-desktop');
        document.body.classList.remove('device-mobile', 'device-tablet');
    }
    
    // Update orientation classes
    if (device.isPortrait) {
        document.body.classList.add('portrait-mode');
        document.body.classList.remove('landscape-mode');
    } else {
        document.body.classList.add('landscape-mode');
        document.body.classList.remove('portrait-mode');
    }
    
    // Update data attributes
    document.body.setAttribute('data-device-width', device.width);
    document.body.setAttribute('data-device-height', device.height);
}

// Initialize device detection
function initDeviceDetection() {
    // Apply initial device settings
    applyDeviceSettings();
    
    // Set up resize listener with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
    
    // Set up orientation change listener
    window.addEventListener('orientationchange', () => {
        setTimeout(applyDeviceSettings, 500);
    });
    
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('reduced-motion');
            disableAnimations();
        } else {
            document.body.classList.remove('reduced-motion');
        }
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-mode-preferred');
        } else {
            document.body.classList.remove('dark-mode-preferred');
        }
    });
    
    // Add device info to console for debugging
    console.log('Device Detection Initialized:', detectDevice());
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeviceDetection);
} else {
    initDeviceDetection();
}

// Export for use in other scripts
window.DeviceDetection = {
    detect: detectDevice,
    applySettings: applyDeviceSettings,
    init: initDeviceDetection
};