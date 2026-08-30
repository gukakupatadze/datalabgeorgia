const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Mock API endpoints for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'DataLab Georgia API is running' });
});

app.get('/api/', (req, res) => {
  res.json({ message: 'DataLab Georgia API', status: 'running' });
});

// Mock testimonials endpoint
app.get('/api/testimonials/', (req, res) => {
  const mockTestimonials = [
    {
      id: 1,
      name: "ნინო ღაღანიძე",
      name_en: "Nino Ghaganidze",
      position: "ბიზნეს ანალიტიკოსი",
      position_en: "Business Analyst",
      text_ka: "DataLab Georgia-მ ჩემი კომპანიის მნიშვნელოვანი მონაცემები აღადგინა დაზიანებული SSD-დან. შედეგი შესანიშნავი იყო!",
      text_en: "DataLab Georgia recovered my company's important data from a damaged SSD. The result was excellent!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b754?w=150&h=150&fit=crop&crop=face",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "გიორგი კვარაცხელია",
      name_en: "Giorgi Kvaratskhelia",
      position: "IT მენეჯერი",
      position_en: "IT Manager",
      text_ka: "პროფესიონალური მიდგომა და სწრაფი მომსახურება. RAID მასივიდან 100% მონაცემები აღადგინეს.",
      text_en: "Professional approach and fast service. They recovered 100% of data from our RAID array.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "ელენე მამუკელაშვილი",
      name_en: "Elene Mamukelashvili",
      position: "ფოტოგრაფი",
      position_en: "Photographer",
      text_ka: "დაზიანებული SD ბარათიდან ყველა ფოტო აღადგინეს. ძალიან კმაყოფილი ვარ სერვისით!",
      text_en: "They recovered all photos from my damaged SD card. Very satisfied with the service!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(mockTestimonials);
});

// Mock service request endpoint
app.post('/api/service-requests/', (req, res) => {
  const { name, email, phone, device_type, problem_description, urgency } = req.body;
  
  // Generate case ID
  const year = new Date().getFullYear();
  const caseNum = Math.floor(Math.random() * 999) + 1;
  const case_id = `DL${year}${caseNum.toString().padStart(3, '0')}`;
  
  res.json({
    success: true,
    message: "Service request created successfully",
    case_id: case_id,
    estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  });
});

// Mock case tracking endpoint
app.get('/api/service-requests/:caseId', (req, res) => {
  const { caseId } = req.params;
  
  // Mock case data
  const mockCase = {
    case_id: caseId,
    name: "ტესტ მომხმარებელი",
    email: "test@example.com",
    phone: "+995555123456",
    device_type: "hdd",
    problem_description: "ტესტ პრობლემა",
    urgency: "medium",
    status: "in_progress",
    created_at: new Date().toISOString(),
    progress_percentage: 50,
    estimated_completion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    price: 150
  };
  
  res.json(mockCase);
});

// Mock contact endpoint
app.post('/api/contact/', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  res.json({
    success: true,
    message: "Contact message sent successfully",
    id: Math.floor(Math.random() * 1000) + 1
  });
});

// Mock price estimation endpoint
app.post('/api/price-estimate/', (req, res) => {
  const { device_type, problem_type, urgency } = req.body;
  
  // Simple price calculation
  const basePrices = {
    'hdd': 100,
    'ssd': 150,
    'raid': 300,
    'usb': 80,
    'sd': 60
  };
  
  const problemMultipliers = {
    'logical': 1.0,
    'physical': 1.5,
    'water': 2.0,
    'fire': 2.5
  };
  
  const urgencyMultipliers = {
    'standard': 1.0,
    'urgent': 1.5,
    'emergency': 2.0
  };
  
  const basePrice = basePrices[device_type] || 100;
  const problemMult = problemMultipliers[problem_type] || 1.0;
  const urgencyMult = urgencyMultipliers[urgency] || 1.0;
  
  const estimatedPrice = Math.round(basePrice * problemMult * urgencyMult);
  
  const timeframes = {
    'standard': { ka: 'სტანდარტული (5-7 დღე)', en: 'Standard (5-7 days)' },
    'urgent': { ka: 'გადაუდებელი (2-3 დღე)', en: 'Urgent (2-3 days)' },
    'emergency': { ka: 'საავარიო (24 საათი)', en: 'Emergency (24 hours)' }
  };
  
  res.json({
    device_type,
    problem_type,
    urgency,
    estimated_price: estimatedPrice,
    timeframe_ka: timeframes[urgency]?.ka || 'სტანდარტული (5-7 დღე)',
    timeframe_en: timeframes[urgency]?.en || 'Standard (5-7 days)',
    currency: "₾"
  });
});

// Serve static files from build directory
app.use(express.static(path.join(__dirname, './build')));

// Handle React Router - send all non-API requests to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    const routePath = req.path.replace(/^\/+|\/+$/g, '');
    if (routePath && /^[A-Za-z0-9/_-]+$/.test(routePath)) {
      const prerenderedPage = path.join(__dirname, 'build', `${routePath}.html`);
      if (fs.existsSync(prerenderedPage)) {
        res.sendFile(prerenderedPage);
        return;
      }
    }
    res.sendFile(path.join(__dirname, './build/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🌟 DataLab Georgia server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, './build')}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
});
