import * as React from "react"
import { Facebook, Instagram, Youtube } from "lucide-react"

const ICON_SIZE = 28
const ICON_COLOR = "#C8102E"

const wrapStyle: React.CSSProperties = {
  display: "inline-block",
  margin: "0 12px",
  verticalAlign: "middle",
  lineHeight: 0,
}

/** Iconos de redes (lucide-react → SVG en el HTML del correo) */
export function EmailSocialIcons() {
  return (
    <div style={{ textAlign: "center", margin: "12px 0" }}>
      <span style={wrapStyle} title="Instagram">
        <Instagram size={ICON_SIZE} color={ICON_COLOR} strokeWidth={1.75} aria-hidden />
      </span>
      <span style={wrapStyle} title="YouTube">
        <Youtube size={ICON_SIZE} color={ICON_COLOR} strokeWidth={1.75} aria-hidden />
      </span>
      <span style={wrapStyle} title="Facebook">
        <Facebook size={ICON_SIZE} color={ICON_COLOR} strokeWidth={1.75} aria-hidden />
      </span>
    </div>
  )
}
