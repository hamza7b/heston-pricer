import katex from "katex"
import "katex/dist/katex.min.css"

function render(math, displayMode) {
  return { __html: katex.renderToString(math, { displayMode, throwOnError: false }) }
}

export function InlineMath({ math }) {
  return <span dangerouslySetInnerHTML={render(math, false)} />
}

export function BlockMath({ math }) {
  return <div dangerouslySetInnerHTML={render(math, true)} />
}
