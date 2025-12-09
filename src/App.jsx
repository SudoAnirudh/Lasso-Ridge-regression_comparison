import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { generateData, preprocessData, solveRidge, solveLasso } from './utils/math';
import { RefreshCw, Settings } from 'lucide-react';

function App() {
  const [data, setData] = useState(null);
  const [lambda, setLambda] = useState(1);
  const [paths, setPaths] = useState({ lasso: [], ridge: [] });
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  // Initial Data Generation
  useEffect(() => {
    handleGenerateData();
  }, []);

  const handleGenerateData = () => {
    setLoading(true);
    setError(null);
    // Use setTimeout to allow UI to update (show loading)
    setTimeout(() => {
      try {
        const newData = generateData(100, 10, 10); // 100 samples, 10 features
        const processed = preprocessData(newData.X, newData.y);

        // Compute paths
        const lambdaValues = [];
        // Logspace from 0.01 to 1000
        for (let i = -2; i <= 4; i += 0.2) {
          lambdaValues.push(Math.pow(10, i));
        }

        const ridgePath = lambdaValues.map(l => {
          const coefs = solveRidge(processed.X, processed.y, l);
          const obj = { lambda: l };
          if (Array.isArray(coefs)) {
            coefs.forEach((c, idx) => obj[`c${idx}`] = c);
          }
          return obj;
        });

        const lassoPath = lambdaValues.map(l => {
          // Note: solveLasso iterative, might be slower
          const coefs = solveLasso(processed.X, processed.y, l);
          const obj = { lambda: l };
          if (Array.isArray(coefs)) {
            coefs.forEach((c, idx) => obj[`c${idx}`] = c);
          }
          return obj;
        });

        setData({ ...newData, processed });
        setPaths({ lasso: lassoPath, ridge: ridgePath });
      } catch (err) {
        console.error("Error generating data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const currentCoefs = useMemo(() => {
    if (!data) return { lasso: [], ridge: [] };

    // Find closest precomputed path or recompute for exact lambda?
    // Recomputing is fast for single point.
    const ridge = solveRidge(data.processed.X, data.processed.y, lambda);
    const lasso = solveLasso(data.processed.X, data.processed.y, lambda);

    return { ridge, lasso };
  }, [data, lambda]);

  const colors = ['#e11d48', '#d946ef', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316'];

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-white">Loading data...</div>;

  return (
    <div className="min-h-screen p-8 text-white">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Lasso vs Ridge Regression
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Explore how L1 (Lasso) and L2 (Ridge) regularization affects regression coefficients.
          Lasso drives coefficients to zero (sparsity), while Ridge shrinks them.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Controls */}
        <div className="card lg:col-span-1 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> Controls
            </h2>
            <button
              onClick={handleGenerateData}
              className="btn flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              New Data
            </button>
          </div>

          <div className="control-group">
            <div className="flex justify-between">
              <label className="control-label">Regularization Strength (λ)</label>
              <span className="text-blue-400 font-mono">{lambda.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.1"
              value={Math.log10(lambda)}
              onChange={(e) => setLambda(Math.pow(10, parseFloat(e.target.value)))}
              className="slider"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.01</span>
              <span>1</span>
              <span>100</span>
              <span>10000</span>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg text-sm text-slate-300">
            <h3 className="font-semibold text-white mb-2">Observation</h3>
            <ul className="list-disc pl-4 space-y-2">
              <li><strong className="text-purple-400">Lasso:</strong> Watch how coefficients hit exactly 0 as λ increases. Helpful for feature selection.</li>
              <li><strong className="text-blue-400">Ridge:</strong> Coefficients get smaller (shrink) but rarely hit exactly zero.</li>
            </ul>
          </div>
        </div>

        {/* Current Coefficients Bar Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Current Coefficients (λ = {lambda.toFixed(2)})</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.true_coef.map((t, i) => ({
                  name: `Feat ${i}`,
                  True: t,
                  Ridge: currentCoefs.ridge[i],
                  Lasso: currentCoefs.lasso[i]
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Bar dataKey="True" fill="#475569" opacity={0.5} name="True Coef" />
                <Bar dataKey="Ridge" fill="#3b82f6" name="Ridge Estimate" />
                <Bar dataKey="Lasso" fill="#a855f7" name="Lasso Estimate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ridge Path */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-blue-400">Ridge Coefficient Path</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <LineChart data={paths.ridge}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="lambda"
                  scale="log"
                  domain={['auto', 'auto']}
                  stroke="#94a3b8"
                  tickFormatter={(Tick) => Number(Tick).toExponential(0)}
                  type="number"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  labelFormatter={(l) => `λ: ${Number(l).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                />
                <ReferenceLine x={lambda} stroke="white" strokeDasharray="3 3" />
                {Array.from({ length: 10 }).map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`c${i}`}
                    stroke={colors[i]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lasso Path */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Lasso Coefficient Path</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <LineChart data={paths.lasso}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="lambda"
                  scale="log"
                  domain={['auto', 'auto']}
                  stroke="#94a3b8"
                  tickFormatter={(Tick) => Number(Tick).toExponential(0)}
                  type="number"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  labelFormatter={(l) => `λ: ${Number(l).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                />
                <ReferenceLine x={lambda} stroke="white" strokeDasharray="3 3" />
                {Array.from({ length: 10 }).map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`c${i}`}
                    stroke={colors[i]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App;
