import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, LogOut, User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState({
    position: '',
    experience: 'Fresher',
    difficulty: 'Easy'
  });
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);

  // Separate forms for login and signup
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const handleLogin = async () => {
    try {
      if (!loginForm.email || !loginForm.password) {
        alert('Please enter email and password');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        setCurrentPage('setup');
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (error) {
      alert('Error: Cannot connect to server. Please make sure backend is running.');
      console.error('Login error:', error);
    }
  };

  const handleSignup = async () => {
    try {
      if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.password) {
        alert('Please fill in all fields');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Account created successfully! Please login.');
        setCurrentPage('login');
        setLoginForm({ email: signupForm.email, password: '' });
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      alert('Error: Cannot connect to server. Please make sure backend is running.');
      console.error('Signup error:', error);
    }
  };

  const startInterview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...interviewConfig
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsInterviewActive(true);
        setCurrentPage('interview');
        connectWebSocket(data.interviewId);
      }
    } catch (error) {
      alert('Error starting interview: ' + error.message);
    }
  };

  const connectWebSocket = (interviewId) => {
    wsRef.current = new WebSocket(`ws://localhost:8080/ws/interview/${interviewId}`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, { type: 'ai', text: data.message, timestamp: new Date() }]);
      speakText(data.message);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      
      if (currentTranscript.trim()) {
        sendMessage(currentTranscript);
        setCurrentTranscript('');
      }
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const sendMessage = (text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: text }));
      setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
    }
  };

  const stopInterview = async () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setIsInterviewActive(false);
    setMessages([]);
    setCurrentPage('setup');
  };

  // Login Page
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <User className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Login to your account</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            />

            <button
              onClick={handleLogin}
              disabled={!loginForm.email || !loginForm.password}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Login
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signup Page
  if (currentPage === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <User className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 mt-2">Sign up to get started</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="First Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={signupForm.firstName}
              onChange={(e) => setSignupForm({...signupForm, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={signupForm.lastName}
              onChange={(e) => setSignupForm({...signupForm, lastName: e.target.value})}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={signupForm.email}
              onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={signupForm.password}
              onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
            />

            <button
              onClick={handleSignup}
              disabled={!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.password}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Sign Up
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentPage('login')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup Page
  if (currentPage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Interview Setup</h1>
              <button
                onClick={() => { setUser(null); setCurrentPage('login'); }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Position</label>
                <input
                  type="text"
                  placeholder="e.g., Software Intern"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={interviewConfig.position}
                  onChange={(e) => setInterviewConfig({...interviewConfig, position: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Experience Level</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={interviewConfig.experience}
                  onChange={(e) => setInterviewConfig({...interviewConfig, experience: e.target.value})}
                >
                  <option>Fresher</option>
                  <option>1-2 Years</option>
                  <option>3-5 Years</option>
                  <option>5+ Years</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Difficulty</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={interviewConfig.difficulty}
                  onChange={(e) => setInterviewConfig({...interviewConfig, difficulty: e.target.value})}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <button
                onClick={startInterview}
                disabled={!interviewConfig.position}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interview Page
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AI Interview - {interviewConfig.position}</h1>
          <button
            onClick={stopInterview}
            className="bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Stop Interview
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-4 h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-4 py-2 rounded-lg max-w-md ${msg.type === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                <p className="text-sm font-semibold mb-1">{msg.type === 'user' ? 'You' : 'AI Interviewer'}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {currentTranscript && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400">Listening...</p>
            <p className="text-white">{currentTranscript}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={toggleRecording}
            className={`flex-1 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Click the microphone button and speak your answer. Click again to send.
        </p>
      </div>
    </div>
  );
}

export default App;