# Project

A simple, modern web application with automated deployment to GitHub Pages.

## 🚀 Live Demo

The project is automatically deployed and available at: **GitHub Pages URL will be available after enabling Pages in repository settings**

## ✨ Features

- Modern, responsive design with gradient background
- Interactive status indicator with pulse animation
- Real-time build date display
- Mobile-friendly layout
- Automated deployment via GitHub Actions

## 🛠️ Deployment

This project uses GitHub Actions for automated deployment to GitHub Pages. Every push to the `main` branch triggers a new deployment.

### Manual Deployment Setup

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The deployment workflow will automatically run on the next push

### Local Development

To run the project locally:

```bash
# Clone the repository
git clone https://github.com/hakanisback/project.git
cd project

# Start a local web server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## 📁 Project Structure

```
project/
├── index.html          # Main HTML file
├── style.css           # Stylesheets
├── script.js           # JavaScript functionality
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions deployment workflow
└── README.md           # Project documentation
```

## 🔧 Technologies Used

- HTML5
- CSS3 (with modern features like CSS Grid, Flexbox, and animations)
- Vanilla JavaScript
- GitHub Actions for CI/CD
- GitHub Pages for hosting

## 📄 License

This project is open source and available under the [MIT License](LICENSE).