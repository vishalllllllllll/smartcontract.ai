import React from 'react';

const StatsCard = ({ icon: Icon, title, count, color = 'blue', gradient = 'from-blue-500 to-purple-600' }) => {
  return (
    <div 
      className="group relative p-6 rounded-2xl border transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <div className="flex items-center space-x-4">
        <div 
          className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white mb-1">{count}</p>
          <p className="text-sm text-gray-300">{title}</p>
        </div>
      </div>
      
      {/* Clean hover effect without blur */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${gradient.includes('blue') ? '#3b82f6' : '#10b981'}20, ${gradient.includes('purple') ? '#9333ea' : '#f59e0b'}20)`,
          filter: 'none'
        }}
      ></div>
    </div>
  );
};

export default StatsCard;