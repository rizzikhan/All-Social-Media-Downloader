# All Social Media Downloader 🎥

A full-stack web application to download videos from YouTube and other platforms. The project consists of a Django backend and a React (Vite) frontend.

## 🌟 Features

- **Multi-Platform Support**: Download videos from YouTube and other supported platforms
- **Multiple Format Options**: Choose from various video qualities and formats
- **Real-time Progress Tracking**: Monitor download progress with a modern UI
- **Video Compression**: Optional compression feature to reduce file size
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI/UX**: Built with React and styled using Tailwind CSS
- **Secure Downloads**: Safe and reliable video downloading process

## 🛠️ Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- yt-dlp for video downloading
- FFmpeg for video processing
- SQLite database (configurable for production)

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Router for navigation

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- **Node.js 16+** and **npm**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rizzikhan/All-Social-Media-Downloader.git
   cd All-Social-Media-Downloader/video_downloader
   ```

2. **Set up the backend**
   ```bash
   # Navigate to the backend directory
   cd backend

   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Run migrations
   python manage.py migrate

   # Start the development server
   python manage.py runserver
   ```
   The backend will be available at `http://127.0.0.1:8000/`

3. **Set up the frontend**
   ```bash
   # Navigate to the frontend directory
   cd ../video-grab-central-main

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```
   The frontend will be available at the URL shown in your terminal (usually `http://localhost:5173/`).

4. **Configure FFmpeg**
   - Ensure FFmpeg is installed on your system
   - Add FFmpeg to your system's PATH
   - For compression features to work, FFmpeg must be accessible from the command line

## �� Usage

1. Open the frontend URL in your browser.
2. Enter the URL of the video you want to download
3. Select your preferred video quality and format
4. Click download and wait for the process to complete
5. Use the download button to save the video to your device

## 🧪 Running Tests

### Backend Tests
```bash
# Navigate to the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Run all tests
python manage.py test downloader.tests

# Run specific test class
python manage.py test downloader.tests.DownloaderAPITests

# Run with verbose output
python manage.py test downloader.tests -v 2
```

### Frontend Tests
```bash
# Navigate to the frontend directory
cd frontend

# Run tests
npm test
```

## 📝 API Documentation

The API endpoints are available at `http://localhost:8000/api/video/`:

- `GET /api/video/info/` - Get video information
- `POST /api/video/download/` - Start video download
- `GET /api/video/download/progress/<download_id>/` - Get download progress
- `GET /api/video/download/file/<download_id>/` - Download the video file
- `POST /api/video/download/cancel/<download_id>/` - Cancel a download

## 🔒 Security Considerations

- All downloads are processed server-side
- File paths are sanitized to prevent directory traversal
- CORS is properly configured
- Input validation is implemented for all endpoints
- Temporary files are cleaned up after download

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for video downloading capabilities
- [FFmpeg](https://ffmpeg.org/) for video processing
- [Django](https://www.djangoproject.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Made with ❤️ by Rizzi Khan 

## 📄 Troubleshooting

- **Port conflicts:** Make sure ports 8000 (backend) and 5173 (frontend) are free.
- **Virtual environment issues:** Ensure you have activated your Python venv before running backend commands.
- **Dependency errors:** Double-check you have installed all requirements for both backend and frontend.
- **Large file errors:** The app is configured to avoid uploading large files to GitHub. Downloads are stored locally and ignored by git.