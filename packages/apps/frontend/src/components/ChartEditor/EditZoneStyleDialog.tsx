import { useEffect, useRef, useState } from "react";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { ZoneOnChart } from "@easy-charts/easycharts-types";
import { NOTE_COLORS, NOTE_SWATCH } from "./EditoroMenuList";

export interface ZoneStyleValues {
  label: string;
  shape: "rectangle" | "ellipse";
  color: string;
  fillColor: string;
  fillOpacity: number;
  borderStyle: "solid" | "dashed" | "dotted";
  borderWidth: number;
}

interface EditZoneStyleDialogProps {
  open: boolean;
  zone: ZoneOnChart | null;
  onClose: () => void;
  onSubmit: (values: ZoneStyleValues) => void;
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function resolveBaseColor(color: string): string {
  const isPreset = NOTE_COLORS.some((c) => c.key === color);
  return isPreset ? (NOTE_SWATCH[color] ?? "#60a5fa") : color;
}

export function EditZoneStyleDialog({
  open,
  zone,
  onClose,
  onSubmit,
}: EditZoneStyleDialogProps) {
  const { isDark } = useThemeMode();
  const [label, setLabel] = useState("");
  const [shape, setShape] = useState<"rectangle" | "ellipse">("rectangle");
  const [color, setColor] = useState("blue");
  const [fillColor, setFillColor] = useState("");
  const [fillOpacity, setFillOpacity] = useState(0);
  const [borderStyle, setBorderStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [borderWidth, setBorderWidth] = useState(2);
  const customColorRef = useRef<HTMLInputElement>(null);
  const customFillColorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && zone) {
      setLabel(zone.label ?? "");
      setShape(zone.shape ?? "rectangle");
      setColor(zone.color ?? "blue");
      setFillColor(zone.fillColor ?? "");
      setFillOpacity(zone.fillOpacity ?? 0);
      setBorderStyle((zone.borderStyle as "solid" | "dashed" | "dotted") ?? "solid");
      setBorderWidth(zone.borderWidth ?? 2);
    }
  }, [open, zone]);

  if (!open || !zone) return null;

  const baseColor = resolveBaseColor(color);
  const isPreset = NOTE_COLORS.some((c) => c.key === color);
  const customColorValue = isPreset ? "#60a5fa" : color;

  const fillBase = fillColor ? resolveBaseColor(fillColor) : baseColor;
  const isFillPreset = fillColor ? NOTE_COLORS.some((c) => c.key === fillColor) : false;
  const customFillColorValue = fillColor ? (isFillPreset ? "#60a5fa" : fillColor) : "#60a5fa";

  const previewFill =
    fillOpacity === 0 ? "transparent" : hexToRgba(fillBase, fillOpacity);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Zone Style</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>

          {/* Label */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Label
            </Typography>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Zone label…"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#f1f5f9" : "#111827",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </Box>

          {/* Shape */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Shape
            </Typography>
            <ToggleButtonGroup
              value={shape}
              exclusive
              onChange={(_e, val) => val && setShape(val)}
              size="small"
            >
              <ToggleButton value="rectangle">Rectangle</ToggleButton>
              <ToggleButton value="ellipse">Ellipse</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Color */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              {NOTE_COLORS.map((c) => (
                <Box
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: NOTE_SWATCH[c.key],
                    cursor: "pointer",
                    border: color === c.key ? "3px solid #6366f1" : "2px solid transparent",
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                  title={c.label}
                />
              ))}
              {/* Custom hex color picker */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: !isPreset ? "3px solid #6366f1" : isDark ? "2px solid #475569" : "2px solid #999",
                  flexShrink: 0,
                  position: "relative",
                }}
                title="Custom color"
                onClick={() => customColorRef.current?.click()}
              >
                <input
                  ref={customColorRef}
                  type="color"
                  value={customColorValue}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "200%",
                    height: "200%",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    opacity: 0,
                  }}
                />
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background:
                      "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Fill Color */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fill Color
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              {/* "Same as border" option */}
              <Box
                onClick={() => setFillColor("")}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: fillColor === "" ? "3px solid #6366f1" : isDark ? "2px solid #475569" : "2px solid #999",
                  background: isDark
                    ? "repeating-linear-gradient(45deg, #475569 0px, #475569 4px, #1e293b 4px, #1e293b 8px)"
                    : "repeating-linear-gradient(45deg, #ccc 0px, #ccc 4px, #fff 4px, #fff 8px)",
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
                title="Same as border color"
              />
              {NOTE_COLORS.map((c) => (
                <Box
                  key={c.key}
                  onClick={() => setFillColor(c.key)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: NOTE_SWATCH[c.key],
                    cursor: "pointer",
                    border: fillColor === c.key ? "3px solid #6366f1" : "2px solid transparent",
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                  title={c.label}
                />
              ))}
              {/* Custom hex fill color picker */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: fillColor && !isFillPreset ? "3px solid #6366f1" : isDark ? "2px solid #475569" : "2px solid #999",
                  flexShrink: 0,
                  position: "relative",
                }}
                title="Custom fill color"
                onClick={() => customFillColorRef.current?.click()}
              >
                <input
                  ref={customFillColorRef}
                  type="color"
                  value={customFillColorValue}
                  onChange={(e) => setFillColor(e.target.value)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "200%",
                    height: "200%",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    opacity: 0,
                  }}
                />
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Fill Opacity */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fill Opacity — {Math.round(fillOpacity * 100)}%
            </Typography>
            <Slider
              value={fillOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(_e, val) => setFillOpacity(val as number)}
              size="small"
            />
          </Box>

          {/* Border Style */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Border Style
            </Typography>
            <ToggleButtonGroup
              value={borderStyle}
              exclusive
              onChange={(_e, val) => val && setBorderStyle(val)}
              size="small"
            >
              <ToggleButton value="solid">Solid</ToggleButton>
              <ToggleButton value="dashed">Dashed</ToggleButton>
              <ToggleButton value="dotted">Dotted</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Border Width */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Border Width — {borderWidth}px
            </Typography>
            <Slider
              value={borderWidth}
              min={0}
              max={10}
              step={1}
              onChange={(_e, val) => setBorderWidth(val as number)}
              size="small"
            />
          </Box>

          {/* Live Preview */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Preview
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: 80,
                background: previewFill,
                border: `${borderWidth}px ${borderStyle} ${baseColor}`,
                borderRadius: shape === "ellipse" ? "50%" : "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {label || "Zone"}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            onSubmit({ label, shape, color, fillColor, fillOpacity, borderStyle, borderWidth })
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
