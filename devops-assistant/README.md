# DevOps Assistant (Go HYDRA) 🚀

**An AI-powered DevOps automation companion built for Octal IT Training Major Project**

## Overview

Go HYDRA is an intelligent DevOps assistant that automates common git workflows, GitHub operations, and CI/CD processes using natural language commands. Built with LangGraph orchestration, it provides a safe, controlled environment for automating repetitive DevOps tasks.

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   React UI      │    │   LangGraph  │    │   Express API   │
│   (Frontend)    │────│   (Planner)  │────│   (Executor)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                    │
         │                       │                    │
         ▼                       ▼                    ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  User Commands  │    │  JSON Plans  │    │  Git/GitHub/CI  │
│  Natural Lang.  │    │  Validation  │    │  Operations     │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## Features

### 🤖 Natural Language Processing

- Convert plain English commands to structured DevOps workflows
- Example: "Go HYDRA: push my changes and create PR to development"

### 🔄 Automated Git Workflows

- Intelligent branch creation with timestamp naming
- Automated commit message templating
- Safe add-commit-push sequences with rollback support

### 🔧 GitHub Integration

- Automated PR creation with reviewer assignment
- Label management and status tracking
- CI/CD trigger automation

### 🛡️ Safety Features

- Dry-run mode for all operations
- Command whitelisting (no arbitrary shell execution)
- Rollback mechanisms for failed operations
- Repository path restrictions

### 📊 Real-time Monitoring

- Live execution logs with timestamps
- Step-by-step plan visualization
- Slack notifications for important events

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git configured locally
- GitHub token with repo permissions
- Slack webhook URL (optional)

### Installation

1. **Clone and setup:**

```bash
git clone <your-repo>
cd devops-assistant

# Install frontend dependencies
cd client && npm install && cd ..

# Install backend dependencies
cd server && npm install && cd ..
```

2. **Configure environment:**
   Copy `server/.env.example` to `server/.env` and fill in your tokens:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USER=your-username
GITHUB_REPO=your-repo-name
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
PORT=4000
ALLOWED_REPOS=/path/to/your/target/repo
```

3. **Start the application:**

```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start frontend
cd client && npm run dev
```

4. **Access the UI:**
   Open http://localhost:5173 in your browser

## Usage Examples

### Basic Commands

**Check Repository Status:**

```
status
```

**Simple Push with Auto-commit:**

```
Go HYDRA: push my current changes with message "fix: update readme"
```

**Create PR with Reviewers:**

```
Go HYDRA: create branch, run tests, and make PR to development with reviewers alice,bob
```

### Advanced Workflows

**Release Branch Creation:**

```
Prepare a release branch from main, run tests, and open a PR to production
```

**Hotfix Deployment:**

```
Go HYDRA: create hotfix branch, commit urgent fix, and push to staging
```

## API Endpoints

### Git Operations

- `POST /git/status` - Get repository status
- `POST /git/add` - Stage files
- `POST /git/commit` - Create commit
- `POST /git/push` - Push to remote
- `POST /git/add-commit-push` - Combined operation

### Branch Operations

- `POST /create-branch` - Create and checkout branch
- `POST /git/fetch` - Fetch from remote

### GitHub Operations

- `POST /create-pr` - Create pull request with reviewers
- `POST /run-tests` - Execute test suite

### Utility

- `POST /rollback` - Rollback failed operations
- `GET /health` - Health check

## LangGraph Integration

The system uses LangGraph to parse natural language into structured plans:

1. **LLM Node**: Converts user text to JSON plan
2. **Validator**: Ensures plan follows allowed schema
3. **Executor**: Runs plan steps via HTTP calls to backend
4. **Monitor**: Handles failures and notifications

### Supported Step Types

- `create_branch` - Branch creation
- `fetch` - Git fetch operation
- `status` - Repository status check
- `run_tests` - Test execution
- `add` - Stage files
- `commit` - Create commit
- `push` - Push to remote
- `create_pr` - GitHub PR creation
- `add_commit_push` - Combined git flow

## Security

### Safety Measures

- **No arbitrary shell execution** - Only whitelisted operations
- **Repository restrictions** - Configurable allowed paths
- **Token scope limiting** - Minimal required permissions
- **Dry-run validation** - All operations previewed first
- **Rollback support** - Automatic cleanup on failures

### Best Practices

- Store secrets in environment variables
- Use personal access tokens with minimal scopes
- Run in isolated environments for production use
- Regular security audits of allowed operations

## Development Roadmap

### Phase 1 ✅ (Current)

- Basic git workflow automation
- Simple UI with command input
- GitHub PR creation
- Slack notifications

### Phase 2 🚧 (In Progress)

- LangGraph integration
- Advanced NLP command parsing
- Comprehensive error handling
- Enhanced UI/UX

### Phase 3 📋 (Planned)

- Multi-repository support
- RBAC and user authentication
- Metrics and analytics dashboard
- CI/CD pipeline integration

### Phase 4 🔮 (Future)

- Cloud deployment automation
- Infrastructure as Code support
- Advanced AI planning capabilities
- Team collaboration features

## Metrics & Impact

### Time Savings Calculation

- **Manual Process**: 6 minutes average for branch + commit + PR + reviewer assignment
- **With HYDRA**: 2 minutes (1 command + confirmation)
- **Savings**: 4 minutes per operation
- **Weekly Impact**: For 20 operations/week = 80 minutes saved per developer

### Error Reduction

- Eliminates manual commit message inconsistencies
- Prevents branch naming conflicts with auto-generation
- Reduces forgotten reviewer assignments
- Standardizes workflow execution

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Octal IT** - Training and project guidance
- **LangGraph** - AI workflow orchestration
- **GitHub API** - Repository automation
- **React + Vite** - Modern frontend development

---

**Built with ❤️ for Octal IT Training Major Project**

_Transform your DevOps workflows with the power of AI automation_
