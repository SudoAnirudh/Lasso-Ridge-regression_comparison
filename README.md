# Lasso vs Ridge Regression Visualizer

This application demonstrates the difference between Lasso (L1) and Ridge (L2) regularization in linear regression.

## Features

- **Interactive Regularization Strength**: Adjust $\lambda$ to see how coefficients shrink.
- **Coefficient Path Plots**: Visualize the "path" of coefficients as $\lambda$ changes.
  - **Lasso**: Notice how coefficients hit exactly zero one by one (Feature Selection).
  - **Ridge**: Coefficients shrink towards zero but rarely reach it exactly.
- **Real-time Data Generation**: Generate new synthetic datasets to test robustness.

## Tech Stack

- **Vite + React**: Fast frontend tooling.
- **Recharts**: For responsive, beautiful charts.
- **Math.js**: For matrix operations in Ridge regression.
- **Custom Math Utils**: Implementation of Coordinate Descent for Lasso.
- **Vanilla CSS**: Custom dark theme.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.
