import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [plan, setPlan] = useState([]);
  const [dryRun, setDryRun] = useState(true);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const callAPI = async (endpoint, data = {}) => {
    try {
      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "API call failed");
      }

      return result;
    } catch (error) {
      addLog(`❌ API Error: ${error.message}`, "error");
      throw error;
    }
  };

  const handleRunCommand = async () => {
    if (!command.trim()) {
      addLog("⚠️ Please enter a command", "warning");
      return;
    }

    setIsLoading(true);
    addLog(`🤖 Processing command: "${command}"`, "info");

    try {
      // For Day 1 demo, we'll parse simple commands
      if (command.toLowerCase().includes("status")) {
        addLog("📊 Checking git status...", "info");
        const result = await callAPI("/git/status");
        addLog(
          `✅ Status: ${result.status.files.length} files changed`,
          "success"
        );

        if (result.status.files.length > 0) {
          result.status.files.forEach((file) => {
            addLog(`   📄 ${file.path} (${file.working_dir})`, "info");
          });
        }
      } else if (command.toLowerCase().includes("go hydra")) {
        // Extract commit message
        const messageMatch =
          command.match(/message[:\s]+"([^"]+)"/i) ||
          command.match(/message[:\s]+(.+?)(?:\s+|$)/i);
        const message = messageMatch
          ? messageMatch[1]
          : "HYDRA: automated commit";

        addLog("🔄 Executing Go HYDRA flow...", "info");

        if (dryRun) {
          addLog("🔍 Running dry-run...", "info");
          const result = await callAPI("/git/add-commit-push", {
            message,
            dryRun: true,
          });

          if (result.plan) {
            setPlan(result.plan);
            setShowPlan(true);
            addLog("📋 Plan generated. Review and confirm to proceed.", "info");
            result.plan.forEach((step) => {
              addLog(
                `   📌 ${step.step}: ${
                  step.files || step.message || step.branch
                }`,
                "info"
              );
            });
          }
        } else {
          addLog("⚡ Executing real run...", "info");
          const result = await callAPI("/git/add-commit-push", { message });

          if (result.results) {
            result.results.forEach((step) => {
              addLog(`✅ ${step.step} completed`, "success");
            });
          }
          addLog("🎉 Go HYDRA completed successfully!", "success");
          setShowPlan(false);
        }
      } else {
        addLog(
          '❓ Command not recognized. Try "status" or "Go HYDRA: push my changes with message ..."',
          "warning"
        );
      }
    } catch (error) {
      addLog(`💥 Operation failed: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPlan = () => {
    setDryRun(false);
    setShowPlan(false);
    handleRunCommand();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 DevOps Assistant (Go HYDRA)</h1>
        <p>Your AI-powered DevOps automation companion</p>
      </header>

      <main className="app-main">
        <div className="command-section">
          <div className="input-group">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={`Enter your command (e.g., "Go HYDRA: push my changes with message 'fix: update readme'")`}
              className="command-input"
              rows={3}
              disabled={isLoading}
            />
            <div className="controls">
              <label className="dry-run-toggle">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={isLoading}
                />
                Dry Run
              </label>
              <button
                onClick={handleRunCommand}
                disabled={isLoading || !command.trim()}
                className="run-button"
              >
                {isLoading ? "⏳ Processing..." : "🚀 Run Command"}
              </button>
              <button
                onClick={clearLogs}
                className="clear-button"
                disabled={isLoading}
              >
                🗑️ Clear Logs
              </button>
            </div>
          </div>

          {showPlan && (
            <div className="plan-confirmation">
              <h3>📋 Execution Plan</h3>
              <div className="plan-steps">
                {plan.map((step, index) => (
                  <div key={index} className="plan-step">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-action">{step.step}</span>
                    <span className="step-details">
                      {step.files && `${step.files} files`}
                      {step.message && `"${step.message}"`}
                      {step.branch && `to ${step.branch}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="plan-actions">
                <button
                  onClick={handleConfirmPlan}
                  className="confirm-button"
                  disabled={isLoading}
                >
                  ✅ Confirm & Execute
                </button>
                <button
                  onClick={() => setShowPlan(false)}
                  className="cancel-button"
                  disabled={isLoading}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="logs-section">
          <div className="logs-header">
            <h3>📜 Execution Logs</h3>
            <span className="logs-count">{logs.length} entries</span>
          </div>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">
                <p>No logs yet. Run a command to see output here.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          🏢 Octal IT - Training Major Project | Built with React + Express +
          LangGraph
        </p>
      </footer>
    </div>
  );
}

export default App;
