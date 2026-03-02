export function GeneratorPanel({
  prompt,
  setPrompt,
  systemPrompt,
  setSystemPrompt,
  onGenerate,
  onRegenerate,
  onGenerateStream,
  disabled,
}) {
  return (
    <div className="generator-block">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional prompt for generate"
        maxLength={15000}
        disabled={disabled}
      />
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="Optional system prompt"
        maxLength={5000}
        disabled={disabled}
      />
      <div className="generator-actions">
        <button type="button" onClick={onGenerate} disabled={disabled}>
          Generate
        </button>
        <button type="button" onClick={onRegenerate} disabled={disabled}>
          Regenerate
        </button>
        <button type="button" onClick={onGenerateStream} disabled={disabled}>
          Generate Stream
        </button>
      </div>
    </div>
  )
}
