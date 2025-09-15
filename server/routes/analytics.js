const express = require("express");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Dashboard analytics
router.get("/dashboard", auth, (req, res) => {
  const demoData = {
    totalContracts: 4,
    completedContracts: 2,
    processingContracts: 1,
    highRiskContracts: 1,
    avgRiskScore: 56.25,
    avgProcessingTime: '2.3 hours',
    totalSavings: '$25,400',
    riskDistribution: [
      { name: 'Low Risk (0-40)', value: 25, contracts: 1 },
      { name: 'Medium Risk (41-70)', value: 25, contracts: 1 },
      { name: 'High Risk (71-100)', value: 25, contracts: 1 },
      { name: 'Processing', value: 25, contracts: 1 }
    ],
    monthlyStats: [
      { month: 'Jan', contracts: 12, riskScore: 45, savings: 8500 },
      { month: 'Feb', contracts: 18, riskScore: 52, savings: 12200 },
      { month: 'Mar', contracts: 15, riskScore: 48, savings: 9800 },
      { month: 'Apr', contracts: 22, riskScore: 58, savings: 15600 },
      { month: 'May', contracts: 19, riskScore: 41, savings: 11400 },
      { month: 'Jun', contracts: 4, riskScore: 56, savings: 2540 }
    ],
    contractTypes: [
      { type: 'Employment', count: 1, avgRisk: 85 },
      { type: 'Software License', count: 1, avgRisk: 65 },
      { type: 'Service Agreement', count: 1, avgRisk: 35 },
      { type: 'Consulting', count: 1, avgRisk: 45 }
    ],
    recentActivity: [
      { action: 'Contract analyzed', contract: 'AI Implementation Agreement', time: '12 hours ago', risk: 'processing' },
      { action: 'High risk detected', contract: 'Employment Contract - Senior Developer', time: '2 days ago', risk: 'high' },
      { action: 'Analysis completed', contract: 'Cloud Hosting Service Agreement', time: '3 days ago', risk: 'low' },
      { action: 'Contract uploaded', contract: 'Software License Agreement', time: '1 day ago', risk: 'medium' }
    ],
    topRisks: [
      { risk: 'Overly broad non-compete clauses', frequency: 45, severity: 'High' },
      { risk: 'Automatic termination without cure period', frequency: 32, severity: 'High' },
      { risk: 'Asymmetric liability limitations', frequency: 28, severity: 'Medium' },
      { risk: 'Unclear intellectual property ownership', frequency: 22, severity: 'Medium' },
      { risk: 'Missing force majeure clauses', frequency: 18, severity: 'Low' }
    ]
  };
  res.json(demoData);
});

// Trends analytics
router.get("/trends", auth, (req, res) => {
  const { period = '30d' } = req.query;

  const generateTrendsData = (period) => {
    const now = new Date();
    let data = [];
    let days = 30;

    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const baseRisk = 50 + Math.sin(i * 0.1) * 20;
      const contracts = Math.floor(Math.random() * 5) + 1;
      const savings = contracts * (Math.random() * 2000 + 1000);

      data.push({
        date: date.toISOString().split('T')[0],
        contracts,
        avgRiskScore: Math.max(0, Math.min(100, baseRisk + (Math.random() - 0.5) * 30)),
        totalSavings: Math.round(savings),
        processingTime: Math.round((Math.random() * 4 + 1) * 10) / 10
      });
    }

    return data;
  };

  res.json({
    period,
    data: generateTrendsData(period),
    summary: {
      totalContracts: 78,
      avgRiskReduction: 23.5,
      totalTimeSaved: '156.2 hours',
      costSavings: '$67,800'
    }
  });
});

// Export data
router.get("/export", auth, (req, res) => {
  const { format = 'json' } = req.query;

  const demoData = {
    exportDate: new Date().toISOString(),
    totalContracts: 4,
    completedContracts: 2,
    avgRiskScore: 56.25,
    totalSavings: '$25,400'
  };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
    res.json(demoData);
  } else {
    res.status(400).json({ message: 'Unsupported export format' });
  }
});

router.get("/", auth, (req, res) => res.json({ analytics: {}, message: "Placeholder endpoint" }));
module.exports = router;
