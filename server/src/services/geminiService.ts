
import { GoogleGenAI, Type } from "@google/genai";
import { AlphaFactor } from "../types";
import { setGlobalDispatcher, ProxyAgent } from 'undici';

const proxyAgent = new ProxyAgent('http://localhost:4780');
setGlobalDispatcher(proxyAgent);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAlphaFactor = async (prompt: string, config: any): Promise<AlphaFactor> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Acting as a Senior Quant for BTC markets, generate a sophisticated alpha factor for: "${prompt}". 
    Universe: ${config.investmentUniverse}. Target: ${config.timeHorizon}.
    Incorporate real-time market regime knowledge. The formula must be a valid one-line Pandas/Numpy expression.
    Also provide recommended buy and sell threshold values based on the factor's characteristics.`,
    config: {
      tools:[ { codeExecution: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          formula: { type: Type.STRING },
          description: { type: Type.STRING },
          intuition: { type: Type.STRING },
          buyThreshold: { type: Type.STRING },
          sellThreshold: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Momentum', 'Value', 'Volatility', 'Quality', 'Sentiment', 'Custom'] },
        },
        required: ['name', 'formula', 'description', 'intuition', 'category'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response");

  // Extract search grounding if available
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || 'Market Reference',
      url: chunk.web?.uri || '#'
    })) || [];

  const result = JSON.parse(text);

  return {
    ...result,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
    sources
  };
};

export const generateBulkAlphaFactors = async (count: number, config: any): Promise<AlphaFactor[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
     # Role
      Chief Quantitative Strategist
    # word list
      - Indicators
        MA, SMA, EMA, MACD, RSI, Bollinger Bands, KDJ, Stochastic Oscillator, CCI, ATR, OBV, Ichimoku Cloud, Parabolic SAR, ADX, MFI, Williams %R, VWAP, DMI, ROC, Aroon Indicator
      - Signal Types
        Golden Cross, Death Cross, Crossover, Divergence, Hidden Divergence, Trend Reversal, Overbought, Oversold, Breakout, False Breakout, Squeeze, Expansion, Zero Line Cross, Midline Cross, Histogram Flip, Histogram Shrink, Failure Swing, Trendline Break, Riding, Slope
      - Conditions & Thresholds
        Upper Band, Lower Band, Mid Band, Bandwidth, Signal Line, MACD Line, Histogram, Threshold 70/30, Midline 50, Volume Spike, Volume Shrink, Multi-Timeframe, Synchronous Signal, Momentum Wane, Trend Accelerate, Support Bounce, Resistance Reject, Alignment, Multiple Cross, Time-Serial, Cross-Sectional, D Days, Abs, Log, Sign, Power, Mean_Volume, High-Low, Open-Close, Prev_Close, Turnover
      - Composite & Strategy Terms
        Composite Factor, Combine with..., Confirmation Signal, Bullish, Bearish, Long Trend, Short Trend, Range Strategy, Trend Continuation, Reversal Point, Buy Signal, Sell Signal, Filter, Confluence, When...and..., New High/Low

    # Task 1: Concept Selection
      Select ${count} unique combinations of concepts from the word list. Ensure diversity in strategy types (Momentum, Mean Reversion, Volatility, etc.).

    # Task 2: Factor Generation
      For each combination, generate a sophisticated alpha factor tailored for the BTC/Crypto market.
      - **Context**: The crypto market operates 24/7 with high volatility and regime shifts. Factors should be robust to noise.
      - **Formula**: The formula MUST be a valid Python expression using \`pandas\` (as pd) and \`pandas_ta\` (as ta). 
        - Example: \`ta.rsi(df['close'], length=14) / ta.sma(df['volume'], length=20)\`
        - Assume \`df\` contains 'open', 'high', 'low', 'close', 'volume'.
      - **Naming**: Create a unique, professional name for each factor (e.g., "VolAdjusted_RSI_Momentum").
      - **Intuition**: Provide a clear economic or market microstructure intuition. Why should this work for BTC?

    # Task 3: Optimization & Thresholds
      - Analyze recent market trends (via your internal knowledge) to suggest optimal buy/sell thresholds.
      - Ensure the logic avoids look-ahead bias (e.g., do not use future data).

    # Core Requirements
      - **High Information Coefficient (IC)**: Target factors with predictive power for next-period returns.
      - **Actionability**: Avoid overly complex formulas that are hard to execute or prone to overfitting.
      - **Syntax Accuracy**: Ensure all generated formulas are syntactically correct for the \`pandas\` and \`pandas_ta\` libraries.
    `,
    config: {
      tools:[ { codeExecution: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            formula: { type: Type.STRING },
            description: { type: Type.STRING },
            intuition: { type: Type.STRING },
            buyThreshold: { type: Type.STRING },
            sellThreshold: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Momentum', 'Value', 'Volatility', 'Quality', 'Sentiment', 'Custom'] },
          },
          required: ['name', 'formula', 'description', 'intuition', 'category'],
        }
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response");

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || 'Market Reference',
      url: chunk.web?.uri || '#'
    })) || [];

  const results = JSON.parse(text);

  return results.map((r: any) => ({
    ...r,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
    sources
  }));
};

export const generateBacktestPythonCode = async (formula: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    You are an expert Python developer and Quantitative Analyst.
    Your task is to generate a standalone, executable Python script to backtest a trading strategy based on a given formula and calculate the Information Coefficient (IC).

    Formula: "${formula}"

    Requirements:
    1.  **Imports**: Import ONLY the necessary packages: \`pandas\`, \`pandas_ta\` (as \`ta\`), \`numpy\` (as \`np\`), \`json\`, \`sys\`.
    2.  **Input**: Read input data from standard input (stdin) using \`json.load(sys.stdin)\`. The input JSON will contain a key \`priceData\`, which is a list of dictionaries. Each dictionary represents a price point and has keys: \`date\`, \`open\`, \`high\`, \`low\`, \`close\`, \`volume\`.
    3.  **Data Processing**:
        *   Convert \`priceData\` to a pandas DataFrame.
        *   Ensure the \`date\` column is converted to datetime objects.
        *   Sort the DataFrame by date.
    4.  **Factor Calculation**:
        *   Calculate the alpha factor values using the provided \`formula\`.
        *   Assume the DataFrame \`df\` has columns: 'open', 'high', 'low', 'close', 'volume'.
        *   Use \`pandas_ta\` (imported as \`ta\`) for any technical indicators required by the formula (e.g., RSI, MACD, etc.).
        *   Store the result in a column named \`factor\`.
        *   Handle potential errors in the formula (e.g., division by zero) gracefully (e.g., using \`fillna(0)\` or \`replace([np.inf, -np.inf], 0)\`).
    5.  **IC Calculation**:
        *   Calculate the **Information Coefficient (IC)**.
        *   IC is defined as the Spearman rank correlation between the current period's factor value (\`factor\`) and the *next* period's return.
        *   Calculate next period's return: \`next_return = df['close'].shift(-1) / df['close'] - 1\`.
        *   Calculate IC: \`ic = df['factor'].corr(df['next_return'], method='spearman')\`.
        *   Handle NaN values properly before correlation calculation.
    6.  **Backtest Simulation**:
        *   Generate trading signals based on the \`factor\`.
            *   Normalize the factor (e.g., Z-score) or use quantiles to determine BUY/SELL signals.
            *   Simple logic: BUY if factor > 90th percentile (or threshold), SELL if factor < 10th percentile. Or use the raw factor if it's already a signal (0/1).
            *   For this task, use a dynamic threshold or a standard default (e.g., top/bottom 20%) if the formula doesn't specify.
        *   Calculate \`strategyReturn\`.
        *   Calculate \`cumulativeStrategy\` and \`cumulativeBenchmark\`.
        *   Generate a list of \`trades\`.
        *   Calculate metrics: \`sharpeRatio\`, \`annualizedReturn\`, \`maxDrawdown\`, \`volatility\`, \`winRate\`.
    7.  **Output**:
        *   Construct a results dictionary containing:
            *   \`data\`: List of records with keys: \`date\` (string YYYY-MM-DD), \`strategyReturn\`, \`benchmarkReturn\`, \`cumulativeStrategy\`, \`cumulativeBenchmark\`, \`signal\` ('BUY', 'SELL', or null).
            *   \`metrics\`: Dictionary with keys: \`sharpeRatio\`, \`annualizedReturn\`, \`maxDrawdown\`, \`volatility\`, \`winRate\`, \`benchmarkName\` (use "Benchmark"), and \`ic\`.
            *   \`trades\`: List of trade dictionaries.
        *   Print the JSON string of this dictionary to **stdout**.
    8.  **Error Handling**: Wrap the main logic in a try-except block. If an error occurs, print a JSON object with an \`error\` key to stdout (or print to stderr).
    9.  **Constraint**: Do NOT output any markdown formatting (like \`\`\`python). Output ONLY the raw Python code.
    `,
    config: {
      responseMimeType: "text/plain",
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  
  // Clean up code block markers if Gemini adds them despite instructions
  return text.replace(/^```python\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};