import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, Brain, Target, Database, Calculator, Zap } from 'lucide-react';

const BillionairePredictor = () => {
  const [ventures, setVentures] = useState([]);
  const [baselineModel, setBaselineModel] = useState(null);
  const [bayesianUpdates, setBayesianUpdates] = useState([]);
  const [logitShift, setLogitShift] = useState(0);
  const [predictionMode, setPredictionMode] = useState('unicorn'); // 'unicorn' | 'decacorn' | 'billionaire'
  const [newVenture, setNewVenture] = useState({
    name: '',
    founders: [],
    sector: 'AI/ML',
    stage: 'Seed',
    teamSize: 5,
    fundingAmount: 2000000,
    vcTier: 'Tier 1',
    expectedEquity: 0.15 // founder equity at exit (0..1)
  });

  // Logit helpers
  const logit = (p) => Math.log(p / (1 - p));
  const invlogit = (x) => 1 / (1 + Math.exp(-x));

  // Initialize baseline model based on research findings
  useEffect(() => {
    const baseline = {
      baseRate: 0.025,          // 2.5% seed → unicorn
      ceoEffect: 0.19,          // not directly used, but recorded
      managementMultiplier: 1.4,
      serialFounderBoost: 1.5,  // prior founder + prior success
      immigrantFounderBoost: 1.2,
      tierOneVCBoost: 1.8,
      priorBigTechBoost: 1.3,
      advancedDegreeBoost: 1.1,
      repeatTeamBoost: 1.25
    };
    setBaselineModel(baseline);

    // Initialize with some sample data
    const sampleVentures = generateSampleVentures();
    setVentures(sampleVentures);
  }, []);

  const generateSampleVentures = () => {
    const sectors = ['AI/ML', 'Fintech', 'Healthtech', 'Enterprise SaaS', 'Consumer', 'Crypto'];
    const stages = ['Seed', 'Series A', 'Series B', 'Series C+'];
    const vcTiers = ['Tier 1', 'Tier 2', 'Tier 3'];

    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Venture ${i + 1}`,
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      stage: stages[Math.floor(Math.random() * stages.length)],
      teamSize: Math.floor(Math.random() * 50) + 5,
      fundingAmount: Math.floor(Math.random() * 50000000) + 1000000,
      vcTier: vcTiers[Math.floor(Math.random() * vcTiers.length)],
      expectedEquity: 0.1 + Math.random() * 0.3, // 10–40% equity
      founders: generateFounders(),
      actualOutcome: Math.random() > 0.95 ? 'Unicorn' : Math.random() > 0.85 ? 'Success' : 'Active',
      predictedProbability: null,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }));
  };

  const generateFounders = () => {
    const founderCount = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: founderCount }, (_, i) => ({
      id: i,
      name: `Founder ${i + 1}`,
      priorFounder: Math.random() > 0.6,
      priorSuccess: Math.random() > 0.7,
      bigTechExperience: Math.random() > 0.5,
      advancedDegree: Math.random() > 0.4,
      immigrant: Math.random() > 0.5,
      yearsExperience: Math.floor(Math.random() * 15) + 2
    }));
  };

  const calculateVentureProbability = (venture) => {
    if (!baselineModel) return 0;

    // 1) baseline as log-odds
    let L = logit(baselineModel.baseRate);

    // online calibration shift
    L += logitShift;

    // 2) founders (geometric mean of multipliers in log-space)
    const founderLogMul =
      venture.founders.reduce((sum, f) => {
        let mul = 1;
        if (f.priorFounder && f.priorSuccess) mul *= baselineModel.serialFounderBoost; // ∼1.5x odds
        if (f.bigTechExperience)              mul *= baselineModel.priorBigTechBoost;   // ∼1.3x
        if (f.advancedDegree)                 mul *= baselineModel.advancedDegreeBoost; // ∼1.1x
        if (f.immigrant)                      mul *= baselineModel.immigrantFounderBoost;// ∼1.2x
        // guard: Math.log(≤0) is invalid; keep mul>=1e-6
        return sum + Math.log(Math.max(mul, 1e-6));
      }, 0) / Math.max(1, venture.founders.length);

    L += founderLogMul;

    // 3) VC tier (odds multipliers in log-space)
    const vcMul = venture.vcTier === 'Tier 1' ? baselineModel.tierOneVCBoost
               : venture.vcTier === 'Tier 2' ? 1.2 : 1.0;
    L += Math.log(vcMul);

    // 4) management/scale proxy (keep small to avoid double counting)
    const mgmtCap = Math.min(venture.teamSize / 20, 1); // 0..1
    const mgmtMul = 1 + mgmtCap * (baselineModel.managementMultiplier - 1); // 1..1.4
    L += Math.log(mgmtMul);

    // 5) stage - later stage implies higher prob (conservative multipliers)
    const stageMul =
      venture.stage === 'Seed'     ? 1.0 :
      venture.stage === 'Series A' ? 1.4 :
      venture.stage === 'Series B' ? 1.8 :
      /* Series C+ */                2.4;
    L += Math.log(stageMul);

    // 6) prediction mode adjustments
    if (predictionMode === 'decacorn') {
      // decacorn is ∼10x rarer than unicorn ⇒ ∼0.1× odds
      L += Math.log(0.1);
    } else if (predictionMode === 'billionaire') {
      // Billionaire mode: proxy P(V * equity >= $1B)
      // e.g., need ~$10B valuation with 10% equity, ~$7B with 15% equity, etc.
      L += Math.log(0.05); // substantially rarer than unicorn (tune as you calibrate)
      const equityBoost = Math.max(venture.expectedEquity / 0.15, 0.5); // normalize to 15% baseline
      L += Math.log(equityBoost);
    }

    // 7) back to probability, clamp for UI sanity
    const p = invlogit(L);
    return Math.min(Math.max(p, 0.001), 0.8);
  };

  const updateBayesianModel = (ventureId, actualOutcome) => {
    const venture = ventures.find(v => v.id === ventureId);
    if (!venture) return;

    const predicted = venture.predictedProbability ?? calculateVentureProbability(venture);
    const actual = actualOutcome === 'Unicorn' ? 1 : 0;

    const error = actual - predicted;

    // Online gradient step on intercept only (keeps things simple & stable)
    const lr = 0.5; // tune this down/up based on stability
    const grad = actual - predicted; // logistic gradient wrt intercept
    setLogitShift(s => s + lr * grad);

    const update = {
      timestamp: new Date(),
      ventureId,
      predicted,
      actual,
      error,
      absoluteError: Math.abs(error)
    };

    setBayesianUpdates(prev => [...prev, update]);

    // Update the venture outcome
    setVentures(prev => prev.map(v =>
      v.id === ventureId ? { ...v, actualOutcome } : v
    ));
  };

  const addNewVenture = () => {
    if (!newVenture.name.trim()) return;

    const venture = {
      ...newVenture,
      id: ventures.length + 1,
      actualOutcome: 'Active',
      predictedProbability: null,
      createdAt: new Date(),
      founders: newVenture.founders.length > 0 ? newVenture.founders : [
        {
          id: 0,
          name: 'Founder 1',
          priorFounder: false,
          priorSuccess: false,
          bigTechExperience: false,
          advancedDegree: false,
          immigrant: false,
          yearsExperience: 5
        }
      ]
    };

    venture.predictedProbability = calculateVentureProbability(venture);
    setVentures(prev => [...prev, venture]);

    // Reset form
    setNewVenture({
      name: '',
      founders: [],
      sector: 'AI/ML',
      stage: 'Seed',
      teamSize: 5,
      fundingAmount: 2000000,
      vcTier: 'Tier 1',
      expectedEquity: 0.15
    });
  };

  const addFounderToNewVenture = () => {
    setNewVenture(prev => ({
      ...prev,
      founders: [
        ...prev.founders,
        {
          id: prev.founders.length,
          name: `Founder ${prev.founders.length + 1}`,
          priorFounder: false,
          priorSuccess: false,
          bigTechExperience: false,
          advancedDegree: false,
          immigrant: false,
          yearsExperience: 5
        }
      ]
    }));
  };

  const updateFounder = (index, field, value) => {
    setNewVenture(prev => ({
      ...prev,
      founders: prev.founders.map((founder, i) =>
        i === index ? { ...founder, [field]: value } : founder
      )
    }));
  };

  // Recalculate all probabilities when state changes
  const venturesWithProbabilities = ventures.map(venture => ({
    ...venture,
    predictedProbability: calculateVentureProbability(venture)
  }));

  // Calibration metrics
  const brier = bayesianUpdates.length
    ? bayesianUpdates.reduce((s, u) => s + Math.pow(u.predicted - u.actual, 2), 0) / bayesianUpdates.length
    : null;

  const logLoss = bayesianUpdates.length
    ? -bayesianUpdates.reduce((s, u) => s + (u.actual ? Math.log(u.predicted || 1e-12) : Math.log(1 - (u.predicted || 1e-12))), 0) / bayesianUpdates.length
    : null;

  const modelAccuracy = bayesianUpdates.length > 0
    ? 1 - (bayesianUpdates.reduce((sum, update) => sum + update.absoluteError, 0) / bayesianUpdates.length)
    : 0;

  const averagePrediction = venturesWithProbabilities.length > 0
    ? venturesWithProbabilities.reduce((sum, v) => sum + v.predictedProbability, 0) / venturesWithProbabilities.length
    : 0;

  const sectorAnalysis = venturesWithProbabilities.reduce((acc, venture) => {
    const sector = venture.sector;
    if (!acc[sector]) {
      acc[sector] = { count: 0, totalProb: 0, unicorns: 0 };
    }
    acc[sector].count++;
    acc[sector].totalProb += venture.predictedProbability;
    if (venture.actualOutcome === 'Unicorn') acc[sector].unicorns++;
    return acc;
  }, {});

  const sectorData = Object.entries(sectorAnalysis).map(([sector, data]) => ({
    sector,
    avgProbability: (data.totalProb / data.count) * 100, // numeric
    count: data.count,
    unicorns: data.unicorns,
    actualRate: data.count > 0 ? (data.unicorns / data.count) * 100 : 0 // numeric
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="text-blue-400" />
          Billionaire Outcome Predictor
        </h1>
        <p className="text-gray-300">
          Bayesian learning system for predicting venture outcomes based on people effects and execution quality
        </p>
      </div>

      {/* Prediction Mode Toggle */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Prediction Mode:</span>
          <div className="flex gap-2">
            {['unicorn', 'decacorn', 'billionaire'].map(mode => (
              <button
                key={mode}
                onClick={() => setPredictionMode(mode)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  predictionMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                {mode === 'billionaire' && ' (Equity-Aware)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-green-400" />
            <span className="text-sm text-gray-400">Model Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {(modelAccuracy * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-blue-400" />
            <span className="text-sm text-gray-400">Avg Prediction</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {(averagePrediction * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-purple-400" />
            <span className="text-sm text-gray-400">Total Ventures</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {ventures.length}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-yellow-400" />
            <span className="text-sm text-gray-400">Bayesian Updates</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {bayesianUpdates.length}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="text-pink-400" />
            <span className="text-sm text-gray-400">Brier Score</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">
            {brier !== null ? brier.toFixed(3) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Add New Venture Form */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="text-blue-400" />
          Add New Venture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Venture Name"
            value={newVenture.name}
            onChange={(e) => setNewVenture(prev => ({ ...prev, name: e.target.value }))}
            className="bg-gray-700 p-3 rounded border border-gray-600 text-white"
          />

          <select
            value={newVenture.sector}
            onChange={(e) => setNewVenture(prev => ({ ...prev, sector: e.target.value }))}
            className="bg-gray-700 p-3 rounded border border-gray-600 text-white"
          >
            <option>AI/ML</option>
            <option>Fintech</option>
            <option>Healthtech</option>
            <option>Enterprise SaaS</option>
            <option>Consumer</option>
            <option>Crypto</option>
          </select>

          <select
            value={newVenture.stage}
            onChange={(e) => setNewVenture(prev => ({ ...prev, stage: e.target.value }))}
            className="bg-gray-700 p-3 rounded border border-gray-600 text-white"
          >
            <option>Seed</option>
            <option>Series A</option>
            <option>Series B</option>
            <option>Series C+</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Team Size</label>
            <input
              type="number"
              value={newVenture.teamSize}
              onChange={(e) => setNewVenture(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 0 }))}
              className="bg-gray-700 p-3 rounded border border-gray-600 text-white w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Funding Amount ($)</label>
            <input
              type="number"
              value={newVenture.fundingAmount}
              onChange={(e) => setNewVenture(prev => ({ ...prev, fundingAmount: parseInt(e.target.value) || 0 }))}
              className="bg-gray-700 p-3 rounded border border-gray-600 text-white w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Expected Equity (0–1)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={newVenture.expectedEquity}
              onChange={(e) => setNewVenture(prev => ({ ...prev, expectedEquity: parseFloat(e.target.value) || 0 }))}
              className="bg-gray-700 p-3 rounded border border-gray-600 text-white w-full"
            />
          </div>

          <select
            value={newVenture.vcTier}
            onChange={(e) => setNewVenture(prev => ({ ...prev, vcTier: e.target.value }))}
            className="bg-gray-700 p-3 rounded border border-gray-600 text-white"
          >
            <option>Tier 1</option>
            <option>Tier 2</option>
            <option>Tier 3</option>
          </select>
        </div>

        {/* Founders Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Founders</h3>
            <button
              onClick={addFounderToNewVenture}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Add Founder
            </button>
          </div>

          {newVenture.founders.map((founder, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded mb-3">
              <input
                type="text"
                placeholder="Founder Name"
                value={founder.name}
                onChange={(e) => updateFounder(index, 'name', e.target.value)}
                className="bg-gray-600 p-2 rounded border border-gray-500 text-white w-full mb-3"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={founder.priorFounder}
                    onChange={(e) => updateFounder(index, 'priorFounder', e.target.checked)}
                    className="rounded"
                  />
                  Prior Founder
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={founder.priorSuccess}
                    onChange={(e) => updateFounder(index, 'priorSuccess', e.target.checked)}
                    className="rounded"
                  />
                  Prior Success
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={founder.bigTechExperience}
                    onChange={(e) => updateFounder(index, 'bigTechExperience', e.target.checked)}
                    className="rounded"
                  />
                  Big Tech Experience
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={founder.advancedDegree}
                    onChange={(e) => updateFounder(index, 'advancedDegree', e.target.checked)}
                    className="rounded"
                  />
                  Advanced Degree
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={founder.immigrant}
                    onChange={(e) => updateFounder(index, 'immigrant', e.target.checked)}
                    className="rounded"
                  />
                  Immigrant
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Years Exp:</span>
                  <input
                    type="number"
                    value={founder.yearsExperience}
                    onChange={(e) => updateFounder(index, 'yearsExperience', parseInt(e.target.value) || 0)}
                    className="bg-gray-600 p-1 rounded border border-gray-500 text-white w-16"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addNewVenture}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-semibold"
        >
          Add Venture & Calculate Probability
        </button>
      </div>

      {/* Sector Analysis */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Sector Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sectorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="sector" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
            />
            <Bar dataKey="avgProbability" fill="#3B82F6" name="Avg Predicted %" />
            <Bar dataKey="actualRate" fill="#10B981" name="Actual Success %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ventures List */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Venture Portfolio</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Sector</th>
                <th className="text-left p-2">Stage</th>
                <th className="text-left p-2">Founders</th>
                <th className="text-left p-2">Predicted %</th>
                <th className="text-left p-2">Actual Outcome</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {venturesWithProbabilities.slice(0, 20).map(venture => (
                <tr key={venture.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="p-2 font-medium">{venture.name}</td>
                  <td className="p-2">{venture.sector}</td>
                  <td className="p-2">{venture.stage}</td>
                  <td className="p-2">{venture.founders.length}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      venture.predictedProbability > 0.10 ? 'bg-green-600' :
                      venture.predictedProbability > 0.05 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {(venture.predictedProbability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      venture.actualOutcome === 'Unicorn' ? 'bg-purple-600' :
                      venture.actualOutcome === 'Success' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {venture.actualOutcome}
                    </span>
                  </td>
                  <td className="p-2">
                    <select
                      onChange={(e) => updateBayesianModel(venture.id, e.target.value)}
                      className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-xs"
                      defaultValue=""
                    >
                      <option value="">Update Outcome</option>
                      <option value="Unicorn">Unicorn</option>
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bayesian Learning Progress */}
      {bayesianUpdates.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Bayesian Learning Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={bayesianUpdates.map((update, index) => ({
                update: index + 1,
                accuracy: 1 - update.absoluteError,
                cumulativeAccuracy:
                  bayesianUpdates.slice(0, index + 1)
                    .reduce((sum, u) => sum + (1 - u.absoluteError), 0) / (index + 1),
                brierScore: Math.pow(update.predicted - update.actual, 2),
                logitShift: logitShift
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="update" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value, name) => [Number(value).toFixed(3), name]}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} name="Update Accuracy" />
              <Line type="monotone" dataKey="cumulativeAccuracy" stroke="#10B981" strokeWidth={2} name="Cumulative Accuracy" />
              <Line type="monotone" dataKey="brierScore" stroke="#EF4444" strokeWidth={2} name="Brier Score" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-400 mt-2">
            Intercept-only online calibration in use. Add learnable weights next for richer updates.
          </p>
        </div>
      )}
    </div>
  );
};

export default BillionairePredictor;

