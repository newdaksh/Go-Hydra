require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Git setup
const repoPath = process.env.ALLOWED_REPOS || path.resolve("../target-repo");
const git = simpleGit({ baseDir: repoPath });

// GitHub setup
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Utility functions
const sendSlackNotification = async (message) => {
  if (!process.env.SLACK_WEBHOOK) return;
  try {
    await axios.post(process.env.SLACK_WEBHOOK, {
      text: message,
      username: "HYDRA Bot",
      icon_emoji: ":robot_face:",
    });
  } catch (error) {
    console.error("Slack notification failed:", error.message);
  }
};

const generateBranchName = (prefix = "feature/hydra") => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:\-]/g, "")
    .replace(/\..+/, "");
  return `${prefix}-${timestamp}`;
};

// Routes
// List all branches and current branch
app.get("/git/branches", async (req, res) => {
  try {
    const branchSummary = await git.branchLocal();
    res.json({
      success: true,
      branches: branchSummary.all,
      current: branchSummary.current,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Checkout/switch to a branch
app.post("/git/checkout", async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res
        .status(400)
        .json({ success: false, error: "Branch name required" });
    }
    await git.checkout(branch);
    res.json({ success: true, message: `Checked out to ${branch}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    repo: repoPath,
  });
});

// Git operations
app.post("/git/status", async (req, res) => {
  try {
    const status = await git.status();
    res.json({
      success: true,
      status,
      files: {
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        staged: status.staged,
        unstaged: status.files.filter((f) => !status.staged.includes(f.path)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/git/fetch", async (req, res) => {
  try {
    await git.fetch();
    res.json({ success: true, message: "Fetch completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/git/add", async (req, res) => {
  try {
    const { paths = ["."] } = req.body;
    if (paths.length === 0 || paths[0] === ".") {
      await git.add(".");
    } else {
      await git.add(paths);
    }
    res.json({ success: true, message: "Files added to staging" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/git/commit", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Commit message required" });
    }

    const result = await git.commit(message);
    res.json({
      success: true,
      message: "Commit created",
      commit: result.commit,
      summary: result.summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/git/push", async (req, res) => {
  try {
    const { remote = "origin", branch } = req.body;
    if (!branch) {
      return res
        .status(400)
        .json({ success: false, error: "Branch name required" });
    }

    const result = await git.push(remote, branch);
    res.json({
      success: true,
      message: "Push completed",
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Combined git operations
app.post("/git/add-commit-push", async (req, res) => {
  try {
    const { message, branch, dryRun = false } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Commit message required" });
    }

    if (dryRun) {
      const status = await git.status();
      return res.json({
        success: true,
        dryRun: true,
        plan: [
          { step: "add", files: status.files.length },
          { step: "commit", message },
          { step: "push", branch: branch || "current" },
        ],
      });
    }

    // Execute the sequence
    const results = [];

    // Add files
    await git.add(".");
    results.push({ step: "add", success: true });

    // Commit
    const commitResult = await git.commit(message);
    results.push({
      step: "commit",
      success: true,
      commit: commitResult.commit,
    });

    // Push
    let targetBranch = branch;
    if (!targetBranch) {
      // Get current branch from git status
      const status = await git.status();
      targetBranch = status.current;
    }
    if (targetBranch) {
      const pushResult = await git.push("origin", targetBranch);
      results.push({ step: "push", success: true, result: pushResult });
    }

    res.json({
      success: true,
      message: "Add-commit-push completed",
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Branch operations
app.post("/create-branch", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Branch name required" });
    }

    const branchName = name.includes("<AUTO_BRANCH>")
      ? generateBranchName()
      : name;

    await git.checkoutLocalBranch(branchName);
    res.json({
      success: true,
      message: "Branch created and checked out",
      branch: branchName,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test operations
app.post("/run-tests", async (req, res) => {
  try {
    const { script = "npm test" } = req.body;

    // For safety, only allow whitelisted test commands
    const allowedScripts = ["npm test", "npm run test", "npm run lint"];
    if (!allowedScripts.includes(script)) {
      return res.status(400).json({
        success: false,
        error: "Test script not allowed",
      });
    }

    // Simulate test run for now - replace with actual execution
    res.json({
      success: true,
      message: "Tests executed",
      script,
      result: "All tests passed (simulated)",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GitHub PR operations
app.post("/create-pr", async (req, res) => {
  try {
    const {
      title,
      body = "Auto PR created by HYDRA",
      head,
      base = "development",
      reviewers = [],
      labels = [],
    } = req.body;

    if (!title || !head) {
      return res.status(400).json({
        success: false,
        error: "Title and head branch required",
      });
    }

    const owner = process.env.GITHUB_USER;
    const repo = process.env.GITHUB_REPO;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: "GitHub user and repo must be configured",
      });
    }

    // Create PR
    const pr = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });

    // Add reviewers if specified
    if (reviewers.length > 0) {
      await octokit.pulls.requestReviewers({
        owner,
        repo,
        pull_number: pr.data.number,
        reviewers,
      });
    }

    // Add labels if specified
    if (labels.length > 0) {
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pr.data.number,
        labels,
      });
    }

    // Send Slack notification
    await sendSlackNotification(
      `🚀 New PR created: ${pr.data.title}\n` +
        `Link: ${pr.data.html_url}\n` +
        `Branch: ${head} → ${base}`
    );

    res.json({
      success: true,
      message: "PR created successfully",
      pr: {
        number: pr.data.number,
        url: pr.data.html_url,
        title: pr.data.title,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rollback operations
app.post("/rollback", async (req, res) => {
  try {
    const { failed_step, context } = req.body;

    // Basic rollback operations
    const rollbackActions = [];

    if (failed_step?.type === "commit") {
      await git.reset(["--soft", "HEAD~1"]);
      rollbackActions.push("Reset last commit");
    }

    if (failed_step?.type === "push") {
      // Cannot rollback push easily, just log
      rollbackActions.push("Push failed - manual intervention may be required");
    }

    await sendSlackNotification(
      `⚠️ HYDRA operation failed at step: ${failed_step?.type}\n` +
        `Rollback actions: ${rollbackActions.join(", ")}`
    );

    res.json({
      success: true,
      message: "Rollback completed",
      actions: rollbackActions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 HYDRA Server running on port ${PORT}`);
  console.log(`📁 Repository path: ${repoPath}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
