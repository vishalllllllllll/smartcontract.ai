import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const contractService = {
  async uploadContract(file) {
    const formData = new FormData();
    formData.append('contract', file);
    
    const response = await api.post('/contracts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getContracts() {
    const response = await api.get('/contracts');
    return response.data.contracts || [];
  },

  async getContract(id) {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  async getContractStatus(id) {
    const response = await api.get(`/contracts/${id}/status`);
    return response.data;
  },

  async deleteContract(id) {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  },

  async getContractMetrics(id) {
    const response = await api.get(`/contracts/${id}/metrics`);
    return response.data;
  }
};

export const chatService = {
  async sendQuery(contractId, query, sessionId) {
    try {
      console.log('🤖 Sending query to Llama model via server API...');
      const response = await api.post('/chat/query', {
        contractId,
        query,
        sessionId
      });
      
      console.log('✅ Received response from Llama model');
      return {
        answer: response.data.answer,
        sessionId: sessionId || `session-${Date.now()}`,
        contractId,
        timestamp: new Date().toISOString(),
        confidence: response.data.hasContext ? 0.9 : 0.7,
        sources: response.data.sources || ['Llama 3.1 AI Analysis'],
        hasContext: response.data.hasContext
      };
    } catch (error) {
      console.warn('⚠️ Llama model not available, falling back to demo responses');
      console.log('Error details:', error.response?.data?.message || error.message);
      
      // Demo intelligent responses as fallback
      const demoResponses = this.generateIntelligentResponse(contractId, query);
      
      // Simulate API response structure
      return {
        answer: `**(Demo Mode - Llama model not connected)**\n\n${demoResponses.response}\n\n*Note: This is a simulated response. To use the real AI analysis, please ensure your Ollama server is running with the Llama model installed.*`,
        sessionId: sessionId || `demo-session-${Date.now()}`,
        contractId,
        timestamp: new Date().toISOString(),
        confidence: demoResponses.confidence,
        sources: [...demoResponses.sources, 'Demo Mode']
      };
    }
  },

  generateIntelligentResponse(contractId, query) {
    const queryLower = query.toLowerCase();
    
    // Contract-specific knowledge base
    const contractKnowledge = {
      'demo-1': { // Software License Agreement
        type: 'Software License',
        keyTerms: ['license', 'software', 'restrictions', 'payment', 'termination'],
        riskFactors: ['automatic termination', 'liability limitations'],
        price: '$50,000 annually'
      },
      'demo-2': { // Employment Contract
        type: 'Employment Contract',
        keyTerms: ['employment', 'non-compete', 'salary', 'intellectual property'],
        riskFactors: ['broad non-compete', 'all IP to company', '24/7 availability'],
        salary: '$120,000 annually'
      },
      'demo-3': { // Cloud Hosting
        type: 'Cloud Hosting',
        keyTerms: ['hosting', 'sla', 'uptime', 'data security', 'pricing'],
        riskFactors: ['standard liability limitation'],
        price: '$2,500 monthly'
      },
      'demo-4': { // Consulting Agreement
        type: 'Consulting Agreement',
        keyTerms: ['consulting', 'ai implementation', 'deliverables', 'milestones'],
        riskFactors: ['performance benchmarks'],
        price: '$150,000 project fee'
      }
    };

    const contract = contractKnowledge[contractId] || contractKnowledge['demo-1'];
    
    // Intelligent response generation based on query patterns
    if (queryLower.includes('risk') || queryLower.includes('danger') || queryLower.includes('concern')) {
      return {
        response: `Based on my analysis of this ${contract.type}, I've identified several key risk factors:\n\n${contract.riskFactors.map((risk, i) => `${i + 1}. **${risk}** - This could potentially create legal or business complications\n`).join('')}\nI recommend having these clauses reviewed by legal counsel before signing. Would you like me to elaborate on any specific risk factor?`,
        confidence: 0.92,
        sources: ['Contract Analysis Engine', 'Legal Risk Database']
      };
    }
    
    if (queryLower.includes('cost') || queryLower.includes('price') || queryLower.includes('fee') || queryLower.includes('payment')) {
      return {
        response: `Regarding the financial terms in this ${contract.type}:\n\n💰 **Primary Cost**: ${contract.price}\n\nKey payment considerations:\n- Payment schedule and terms are clearly defined\n- Late payment penalties may apply\n- Consider negotiating more favorable payment terms\n\nWould you like me to analyze the cost structure in more detail or compare it to industry standards?`,
        confidence: 0.89,
        sources: ['Contract Financial Analysis', 'Industry Benchmarks']
      };
    }
    
    if (queryLower.includes('termination') || queryLower.includes('end') || queryLower.includes('cancel')) {
      return {
        response: `The termination clauses in this ${contract.type} contain important provisions:\n\n📋 **Termination Rights**:\n- Notice requirements vary by party\n- Different termination triggers apply\n- Post-termination obligations exist\n\n⚠️ **Key Concern**: Some termination clauses appear to favor one party over the other. I recommend reviewing these terms carefully to ensure they're balanced and fair.\n\nShould I break down the specific termination scenarios for you?`,
        confidence: 0.88,
        sources: ['Contract Clause Analysis', 'Legal Precedents']
      };
    }
    
    if (queryLower.includes('intellectual property') || queryLower.includes('ip') || queryLower.includes('copyright')) {
      return {
        response: `The intellectual property provisions in this contract are significant:\n\n🧠 **IP Ownership**: The current terms heavily favor one party\n📝 **Scope**: Covers both work-related and personal time creations\n⚖️ **Balance**: These terms may be overly broad\n\n**Recommendation**: Consider negotiating more balanced IP terms that protect both parties' interests while allowing fair use of pre-existing knowledge and skills.\n\nWould you like specific suggestions for IP clause modifications?`,
        confidence: 0.91,
        sources: ['IP Law Database', 'Contract Best Practices']
      };
    }
    
    if (queryLower.includes('negotiate') || queryLower.includes('change') || queryLower.includes('modify')) {
      return {
        response: `Here are my recommendations for negotiating this ${contract.type}:\n\n🔧 **Priority Changes**:\n1. **Balance termination clauses** - Ensure fair notice periods\n2. **Clarify liability limits** - Add mutual protections\n3. **Review payment terms** - Consider more favorable schedules\n\n💡 **Negotiation Strategy**:\n- Focus on mutual benefit rather than one-sided terms\n- Propose specific language changes\n- Consider industry standard practices\n\nWould you like me to draft specific alternative language for any problematic clauses?`,
        confidence: 0.87,
        sources: ['Negotiation Strategies', 'Contract Templates']
      };
    }
    
    if (queryLower.includes('summary') || queryLower.includes('overview') || queryLower.includes('explain')) {
      return {
        response: `Here's a comprehensive overview of this ${contract.type}:\n\n📋 **Contract Type**: ${contract.type}\n🎯 **Key Terms**: ${contract.keyTerms.join(', ')}\n⚠️ **Risk Level**: ${contract.riskFactors.length > 2 ? 'High' : contract.riskFactors.length > 0 ? 'Medium' : 'Low'}\n💰 **Financial Terms**: ${contract.price}\n\n**Overall Assessment**: This contract contains both standard and concerning provisions. The key areas requiring attention are ${contract.riskFactors.join(' and ')}.\n\nWhat specific aspect would you like me to dive deeper into?`,
        confidence: 0.85,
        sources: ['Contract Analysis Engine', 'Legal Database']
      };
    }
    
    if (queryLower.includes('recommend') || queryLower.includes('advice') || queryLower.includes('should')) {
      return {
        response: `Based on my analysis of this ${contract.type}, here are my key recommendations:\n\n✅ **Immediate Actions**:\n1. Have legal counsel review high-risk clauses\n2. Consider negotiating more balanced terms\n3. Document any verbal agreements in writing\n\n📋 **Before Signing**:\n- Ensure you understand all obligations\n- Verify compliance requirements\n- Plan for potential scenarios\n\n⚖️ **Legal Considerations**: Some clauses may not be enforceable in all jurisdictions. Local legal advice is recommended.\n\nWould you like specific guidance on any particular clause or concern?`,
        confidence: 0.90,
        sources: ['Legal Best Practices', 'Risk Management Guidelines']
      };
    }
    
    // Default intelligent response
    return {
      response: `I've analyzed your question about this ${contract.type}. This contract contains ${contract.keyTerms.length} key terms and ${contract.riskFactors.length} identified risk factors.\n\n🤖 **AI Analysis**: I can help you understand:\n- Risk assessment and mitigation\n- Financial implications\n- Legal terminology\n- Negotiation strategies\n- Industry comparisons\n\nTo provide the most relevant insights, could you ask about a specific aspect like risks, costs, termination, or negotiation points?`,
      confidence: 0.75,
      sources: ['General Contract Knowledge', 'AI Analysis Engine']
    };
  },

  async getChatHistory(contractId) {
    try {
      const response = await api.get(`/chat/sessions/${contractId}`);
      return response.data;
    } catch (error) {
      console.log('Server not available, using demo chat history');
      return {
        sessions: [],
        messages: [
          {
            id: 'demo-msg-1',
            type: 'assistant',
            content: `Hello! I'm your AI contract analyst. I've reviewed this contract and I'm ready to help you understand its terms, identify risks, and provide recommendations. What would you like to know?`,
            timestamp: new Date(Date.now() - 30000).toISOString(),
            confidence: 0.95
          }
        ]
      };
    }
  },

  async clearChatSession(sessionId) {
    try {
      const response = await api.delete(`/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.log('Demo mode: Chat session cleared locally');
      return { success: true, message: 'Chat session cleared' };
    }
  }
};

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async clearAll() {
    const response = await api.delete('/notifications/clear');
    return response.data;
  }
};

export const analyticsService = {
  async getDashboard() {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.log('Server not available, using demo analytics data');
      // Return demo data that matches our sample contracts
      return {
        totalContracts: 4,
        completedContracts: 2,
        processingContracts: 1,
        highRiskContracts: 1,
        avgRiskScore: 56.25, // (65 + 85 + 35 + 0) / 4 contracts
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
    }
  },

  async getTrends(period = '30d') {
    try {
      const response = await api.get(`/analytics/trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.log('Server not available, using demo trends data');
      
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
          
          // Generate realistic trending data
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
      
      return {
        period,
        data: generateTrendsData(period),
        summary: {
          totalContracts: 78,
          avgRiskReduction: 23.5,
          totalTimeSaved: '156.2 hours',
          costSavings: '$67,800'
        }
      };
    }
  },

  async exportData(format = 'json') {
    try {
      const response = await api.get(`/analytics/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.log('Server not available, generating demo export data');
      const demoData = await this.getDashboard();
      const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: 'application/json' });
      return blob;
    }
  }
};

export const settingsService = {
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.log('Settings API unavailable, using local settings');
      // Get settings from localStorage or use defaults
      const savedSettings = localStorage.getItem('smartcontract_settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      
      const defaultSettings = {
        notifications: {
          email: {
            enabled: true,
            contractAnalysis: true,
            riskAlerts: true,
            systemUpdates: false,
            marketing: false
          },
          push: {
            enabled: true,
            contractAnalysis: true,
            riskAlerts: true,
            systemUpdates: false
          },
          inApp: {
            enabled: true,
            autoMarkRead: false,
            soundEnabled: true
          }
        },
        ai: {
          model: 'llama3.2:3b',
          temperature: 0.3,
          maxTokens: 1500
        },
        processing: {
          autoProcess: true,
          enableOCR: true,
          language: 'en'
        },
        ui: {
          language: 'en',
          timezone: 'UTC'
        }
      };
      
      // Save defaults to localStorage
      localStorage.setItem('smartcontract_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
  },

  async updateSettings(updates) {
    try {
      const response = await api.put('/settings', updates);
      return response.data;
    } catch (error) {
      console.log('Settings update API unavailable, saving locally');
      
      // Get current settings from localStorage
      const currentSettings = localStorage.getItem('smartcontract_settings');
      let settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      // Merge updates with current settings
      settings = { ...settings, ...updates };
      
      // Save to localStorage
      localStorage.setItem('smartcontract_settings', JSON.stringify(settings));
      
      return { 
        success: true, 
        message: 'Settings updated successfully',
        settings: settings
      };
    }
  },

  async getNotificationSettings() {
    const response = await api.get('/settings/notifications');
    return response.data;
  },

  async updateNotificationSettings(settings) {
    const response = await api.put('/settings/notifications', settings);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/settings/profile');
    return response.data;
  },

  async updateProfile(profile) {
    const response = await api.put('/settings/profile', profile);
    return response.data;
  },

  async getAISettings() {
    const response = await api.get('/settings/ai');
    return response.data;
  },

  async updateAISettings(settings) {
    const response = await api.put('/settings/ai', settings);
    return response.data;
  },

  async resetSettings(section = 'all') {
    try {
      const response = await api.post('/settings/reset', { section });
      return response.data;
    } catch (error) {
      console.log('Settings reset API unavailable, returning demo success');
      return { 
        success: true, 
        message: `${section} settings reset to default (demo mode)` 
      };
    }
  },

  async exportSettings() {
    try {
      const response = await api.get('/settings/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.log('Settings export API unavailable, creating demo export');
      const demoSettings = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        settings: {
          notifications: { email: { enabled: true } },
          ai: { model: 'gpt-4-turbo' },
          ui: { theme: 'system' }
        }
      };
      return new Blob([JSON.stringify(demoSettings, null, 2)], { type: 'application/json' });
    }
  },

  async importSettings(settings) {
    const response = await api.post('/settings/import', { settings });
    return response.data;
  }
};

export default api;