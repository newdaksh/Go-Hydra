import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [plan, setPlan] = useState([]);
  const [dryRun, setDryRun] = useState(true);
  const [repoStatus, setRepoStatus] = useState(null);
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

  const executeEnhancedHydraFlow = async (targetBranch, commitMessage) => {
    try {
      // Step 1: Fetch
      addLog("1️⃣ Fetching latest changes...", "info");
      await fetch("http://localhost:4000/git/fetch", { method: "POST" });
      addLog("✅ Fetch completed", "success");

      // Step 2: Status
      addLog("2️⃣ Checking repository status...", "info");
      const statusResult = await callAPI("/git/status");
      addLog(
        `✅ Status checked: ${statusResult.status.files.length} files to process`,
        "success"
      );

      // Status details are now only shown in the Repository Status container

      // Step 3: Add
      addLog("3️⃣ Staging all changes...", "info");
      await callAPI("/git/add", { paths: ["."] });
      addLog("✅ All changes staged", "success");

      // Step 4: Commit
      addLog("4️⃣ Creating commit...", "info");
      const commitResult = await callAPI("/git/commit", {
        message: commitMessage,
      });
      addLog(`✅ Commit created: ${commitResult.commit}`, "success");

      // Step 5: Push
      addLog("5️⃣ Pushing to remote...", "info");
      await callAPI("/git/push", { remote: "origin", branch: targetBranch });
      addLog(`✅ Pushed to origin/${targetBranch}`, "success");

      addLog("🎉 Enhanced HYDRA flow completed successfully!", "success");
    } catch (error) {
      addLog(`💥 Enhanced flow failed: ${error.message}`, "error");
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
      const lowerCmd = command.toLowerCase().trim();
      // Show all branches
      if (lowerCmd === "branch" || lowerCmd === "branches") {
        const response = await fetch("http://localhost:4000/git/branches");
        const result = await response.json();
        if (result.success) {
          addLog(`🌿 Current branch: ${result.current}`, "info");
          addLog(`🌿 All branches: ${result.branches.join(", ")}`, "info");
        } else {
          addLog(`❌ Failed to get branches: ${result.error}`, "error");
        }
        setIsLoading(false);
        return;
      }

      // Enhanced Go Hydra command: "Go Hydra : Push to <branch> "<message>"" or "Hydra : Push to <branch> "<message>""
      const enhancedHydraMatch = command.match(
        /^(?:go\s+)?hydra\s*:\s*push\s+to\s+(\S+)\s+"([^"]+)"/i
      );
      if (enhancedHydraMatch) {
        const targetBranch = enhancedHydraMatch[1];
        const commitMessage = enhancedHydraMatch[2];

        addLog(`🚀 Starting enhanced HYDRA flow...`, "info");
        addLog(`📌 Target branch: ${targetBranch}`, "info");
        addLog(`💬 Commit message: "${commitMessage}"`, "info");

        if (dryRun) {
          addLog("🔍 Running dry-run...", "info");

          // Get current status during dry-run and store for Repository Status container
          try {
            const statusResult = await callAPI("/git/status");
            // Store status in state for separate display in Repository Status container
            setRepoStatus(statusResult);
            addLog("� Repository status loaded in status panel", "info");
          } catch (error) {
            addLog(`⚠️ Could not get status: ${error.message}`, "warning");
          }

          const dryRunPlan = [
            { step: "fetch", description: "Fetch latest changes from remote" },
            { step: "status", description: "Check repository status" },
            { step: "add", description: "Stage all changes" },
            {
              step: "commit",
              description: `Commit with message: "${commitMessage}"`,
            },
            { step: "push", description: `Push to origin/${targetBranch}` },
          ];

          setPlan(dryRunPlan);
          setShowPlan(true);
          addLog(
            "📋 Enhanced plan generated. Review and confirm to proceed.",
            "info"
          );
          dryRunPlan.forEach((step, index) => {
            addLog(
              `   ${index + 1}. ${step.step}: ${step.description}`,
              "info"
            );
          });
        } else {
          // Execute the 5-step process
          await executeEnhancedHydraFlow(targetBranch, commitMessage);
        }
        setIsLoading(false);
        return;
      }

      // Simple checkout/switch branch: "Hydra <branchName>"
      const hydraBranchMatch = command.match(/^(?:go\s+)?hydra\s+(\S+)$/i);
      if (hydraBranchMatch) {
        const branchName = hydraBranchMatch[1];
        addLog(`🔀 Switching to branch: ${branchName}`, "info");
        const result = await callAPI("/git/checkout", { branch: branchName });
        if (result.success) {
          addLog(`✅ Checked out to branch: ${branchName}`, "success");
        } else {
          addLog(`❌ Failed to checkout: ${result.error}`, "error");
        }
        setIsLoading(false);
        return;
      }

      // For Day 1 demo, we'll parse simple commands
      if (lowerCmd.includes("status")) {
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
      } else if (lowerCmd.includes("go hydra")) {
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
          "❓ Command not recognized. Try:\n" +
            '• "status" - Check git status\n' +
            '• "branch" - Show all branches\n' +
            '• "Hydra <branch>" - Switch to branch\n' +
            '• "Hydra : Push to <branch> \\"<message>\\"" - Full 5-step flow\n' +
            '• "Go HYDRA: push my changes with message \\"<message>\\"" - Legacy flow',
          "warning"
        );
      }
    } catch (error) {
      addLog(`💥 Operation failed: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setShowPlan(false);
    addLog("⚡ Executing real run...", "info");
    try {
      // Check if this is an enhanced HYDRA command
      const enhancedHydraMatch = command.match(
        /^(?:go\s+)?hydra\s*:\s*push\s+to\s+(\S+)\s+"([^"]+)"/i
      );
      if (enhancedHydraMatch) {
        const targetBranch = enhancedHydraMatch[1];
        const commitMessage = enhancedHydraMatch[2];
        await executeEnhancedHydraFlow(targetBranch, commitMessage);
      } else {
        // Handle legacy Go HYDRA commands
        const messageMatch =
          command.match(/message[:\s]+"([^"]+)"/i) ||
          command.match(/message[:\s]+(.+?)(?:\s+|$)/i);
        const message = messageMatch
          ? messageMatch[1]
          : "HYDRA: automated commit";
        const result = await callAPI("/git/add-commit-push", { message });
        if (result.results) {
          result.results.forEach((step) => {
            addLog(`✅ ${step.step} completed`, "success");
          });
        }
        addLog("🎉 Go HYDRA completed successfully!", "success");
      }
    } catch (error) {
      addLog(`💥 Operation failed: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
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

        <div className="logs-status-container">
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

          <div className="status-section">
            <div className="status-header">
              <h3>📊 Repository Status</h3>
              {repoStatus && (
                <span className="status-count">
                  {repoStatus.status.files.length} files
                </span>
              )}
            </div>
            <div className="status-container">
              {!repoStatus ? (
                <div className="no-status">
                  <p>Run a command to see repository status here.</p>
                </div>
              ) : (
                <div className="status-content">
                  {/* Current Branch */}
                  <div className="status-group">
                    <h4>🌿 Current Branch</h4>
                    <div className="status-item">
                      <span className="status-label">Branch:</span>
                      <span className="status-value">
                        {repoStatus.status.current}
                      </span>
                    </div>
                    {repoStatus.status.tracking && (
                      <div className="status-item">
                        <span className="status-label">Tracking:</span>
                        <span className="status-value">
                          {repoStatus.status.tracking}
                        </span>
                      </div>
                    )}
                    {repoStatus.status.ahead > 0 && (
                      <div className="status-item">
                        <span className="status-label">⬆️ Ahead:</span>
                        <span className="status-value">
                          {repoStatus.status.ahead} commits
                        </span>
                      </div>
                    )}
                    {repoStatus.status.behind > 0 && (
                      <div className="status-item">
                        <span className="status-label">⬇️ Behind:</span>
                        <span className="status-value">
                          {repoStatus.status.behind} commits
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Staged Files */}
                  {repoStatus.files.staged &&
                    repoStatus.files.staged.length > 0 && (
                      <div className="status-group">
                        <h4>
                          🟢 Staged Files ({repoStatus.files.staged.length})
                        </h4>
                        <div className="file-list">
                          {repoStatus.files.staged.map((file, index) => (
                            <div key={index} className="file-item staged">
                              📄 {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Modified Files */}
                  {repoStatus.files.modified &&
                    repoStatus.files.modified.length > 0 && (
                      <div className="status-group">
                        <h4>
                          🟡 Modified Files ({repoStatus.files.modified.length})
                        </h4>
                        <div className="file-list">
                          {repoStatus.files.modified.map((file, index) => (
                            <div key={index} className="file-item modified">
                              📄 {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* New Files */}
                  {repoStatus.files.created &&
                    repoStatus.files.created.length > 0 && (
                      <div className="status-group">
                        <h4>
                          🟢 New Files ({repoStatus.files.created.length})
                        </h4>
                        <div className="file-list">
                          {repoStatus.files.created.map((file, index) => (
                            <div key={index} className="file-item created">
                              📄 {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Deleted Files */}
                  {repoStatus.files.deleted &&
                    repoStatus.files.deleted.length > 0 && (
                      <div className="status-group">
                        <h4>
                          🔴 Deleted Files ({repoStatus.files.deleted.length})
                        </h4>
                        <div className="file-list">
                          {repoStatus.files.deleted.map((file, index) => (
                            <div key={index} className="file-item deleted">
                              📄 {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Unstaged Files */}
                  {repoStatus.files.unstaged &&
                    repoStatus.files.unstaged.length > 0 && (
                      <div className="status-group">
                        <h4>
                          ⚪ Unstaged Files ({repoStatus.files.unstaged.length})
                        </h4>
                        <div className="file-list">
                          {repoStatus.files.unstaged.map((file, index) => (
                            <div key={index} className="file-item unstaged">
                              📄 {file.path} ({file.working_dir})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {repoStatus.status.files.length === 0 && (
                    <div className="status-clean">
                      <span>✨ Working directory is clean</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
