# Model & Token Observability --- Future Implementation Plan

> **Status:** Deferred --- implement after the core streaming
> architecture is stable.

## Goal

Measure and compare Gemini models using real application workloads
before changing the production model.

The goal is to make model decisions based on **latency, token usage,
quota, cost, and RAG answer quality**, rather than simply choosing a
model because it has a higher limit or newer version.

------------------------------------------------------------------------

## 1. Capture Model Metrics

For each request, record:

-   Model name
-   Prompt character count
-   Input token count (actual where available)
-   Output token count (actual where available)
-   Conversation history message count
-   Number of retrieved RAG chunks
-   Retrieved-context character count
-   Gemini TTFT
-   Total generation time
-   Request status / errors
-   Rate-limit events (429)

Example:

``` text
Model: gemini-2.5-flash
Prompt chars: 18,421
Input tokens: 4,721
History messages: 5
Retrieved chunks: 5
TTFT: 2.73s
Total generation: 8.14s
```

------------------------------------------------------------------------

## 2. Token Counting Strategy

Token counts are useful for:

-   RAG/context optimization
-   TPM quota tracking
-   cost estimation
-   model comparison
-   diagnosing latency changes

Use the following priority:

1.  **Use response usage metadata** when LangChain/Gemini exposes actual
    token usage.
2.  During development/debugging, use Gemini's `countTokens` capability
    when an exact pre-request count is needed.
3.  For lightweight telemetry only, use character-based estimation and
    label it clearly as `estimated_tokens`.

Do **not** make an additional token-counting API request on every
production request unless there is a specific reason to do so.

------------------------------------------------------------------------

## 3. Track Gemini Quota Usage

Monitor:

``` text
Requests per minute (RPM)
Input tokens per minute (TPM)
Requests per day (RPD)
```

The application should eventually record local usage so development
traffic does not unexpectedly exhaust the Gemini free-tier quota.

If practical, surface a developer warning such as:

``` text
⚠️ Gemini quota approaching limit
```

Do not rely on 429 errors as the first indication of quota exhaustion.

------------------------------------------------------------------------

## 4. Model Benchmark

Keep the current model as the baseline:

``` text
gemini-2.5-flash
```

Then benchmark suitable alternatives, starting with models such as:

``` text
gemini-2.5-flash-lite
```

Additional models can be tested later if they are relevant to the
project's requirements.

Use a fixed set of approximately **20 representative questions** from
the actual RAG application.

For every model, use the same:

-   Questions
-   Retrieved context
-   Conversation history
-   Prompt
-   Generation configuration

Measure:

  Metric                  Purpose
  ----------------------- ----------------------------
  TTFT                    Perceived responsiveness
  Total generation time   Overall latency
  Input tokens            Context efficiency / TPM
  Output tokens           Usage / cost
  Answer quality          Model usefulness
  RAG accuracy            Retrieval-grounded quality
  Citation accuracy       Source reliability
  Rate-limit behavior     Development reliability

------------------------------------------------------------------------

## 5. Model Selection Criteria

Do not choose a model solely based on:

-   highest RPM
-   newest model version
-   lowest price
-   highest intelligence rating

Choose based on the project's actual trade-off:

``` text
Quality
+
RAG accuracy
+
TTFT
+
Total latency
+
Token usage
+
Quota
+
Cost
```

The benchmark should produce a comparison such as:

``` text
Model A → faster, slightly lower quality
Model B → slower, better RAG accuracy
Model C → cheapest, acceptable quality
```

Then select the model with the best overall fit for the application.

------------------------------------------------------------------------

## 6. Important Separation From Streaming Work

This phase is **not part of the core streaming implementation**.

Do not mix model benchmarking with:

-   `stream()` → `astream()`
-   SSE protocol changes
-   frontend rendering changes
-   cancellation
-   streaming error handling

First establish a stable streaming baseline.

Then perform model/token observability and benchmarking as a separate
optimization phase.

------------------------------------------------------------------------

## Definition of Done

This phase is complete when we can answer, with real project data:

1.  How many input/output tokens does a typical RAG request use?
2.  How much quota does the application consume?
3.  What is the normal TTFT?
4.  Which model gives the best RAG answer quality?
5.  Which model provides the best latency/quality/quota trade-off?
6.  What model should be used as the application's production baseline?

**No model switch should be made until these measurements are
available.**
