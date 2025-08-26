// Set the build date to current date
document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    
    const buildDateElement = document.getElementById('build-date');
    if (buildDateElement) {
        buildDateElement.textContent = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Add some interactive feedback
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'pulse 2s infinite';
            }, 10);
        });
    }
    
    // Console message for developers
    console.log('🚀 Project successfully deployed!');
    console.log('Repository: hakanisback/project');
    console.log('Deployment time:', now.toISOString());
});