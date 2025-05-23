import { VideoDownloader } from './components/VideoDownloader';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Video Grab Central</h1>
        </div>
      </header>
      <main className="py-8">
        <VideoDownloader />
      </main>
    </div>
  );
}

export default App;
