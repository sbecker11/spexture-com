# GitHub Repository Setup Guide for spexture-com

## Step 1: Initialize Git Repository

Run these commands in your terminal from the project root (`/Users/sbecker11/workspace-react/spexture-com`):

```bash
# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: spexture-com project"
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub Web Interface (Recommended)

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `spexture-com`
   - **Description**: (optional) Add a description for your project
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (since you already have these)
5. Click **"Create repository"**

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create spexture-com --private --source=. --remote=origin --push
```

## Step 3: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/spexture-com.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/spexture-com.git

# Verify the remote was added
git remote -v
```

## Step 4: Push Your Code

```bash
# Rename default branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 5: Verify

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/spexture-com`
2. Verify all your files are there
3. Check that sensitive files (like `.env`, `node_modules`, etc.) are not included (they should be ignored by `.gitignore`)

## Additional Notes

- Your `.gitignore` file is already configured to exclude:
  - `node_modules/`
  - `coverage/`
  - `build/`
  - `.env` files
  - Docker-related files
  - And other common files that shouldn't be versioned

- If you need to update the repository URL later:
  ```bash
  git remote set-url origin https://github.com/YOUR_USERNAME/spexture-com.git
  ```

- To check your current git status:
  ```bash
  git status
  ```

## Troubleshooting

If you encounter authentication issues:
- For HTTPS: You may need to use a Personal Access Token instead of a password
- For SSH: Make sure your SSH key is added to your GitHub account

If you need to remove the remote and start over:
```bash
git remote remove origin
```


