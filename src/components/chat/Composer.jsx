export function Composer({ value, setValue, onSend, disabled }) {
  return (
    <form className="composer" onSubmit={onSend}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write user message and press Send"
        maxLength={15000}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Send USER
      </button>
    </form>
  )
}
