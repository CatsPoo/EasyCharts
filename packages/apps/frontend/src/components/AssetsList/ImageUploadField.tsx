import { Box, Button, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useRef, useState } from "react";
import { http } from "../../api/http";

type Props = {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  folder?: string;
  allowRemove?: boolean;
  onRemoved?: () => void;
};

export function ImageUploadField({
  currentUrl,
  onUploaded,
  folder = "custom-elements",
  allowRemove = false,
  onRemoved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await http.post<{ url: string }>(
        `/upload?folder=${folder}`,
        formData,
      );
      setPreview(data.url);
      onUploaded(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(undefined);
    onRemoved?.();
  }

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        {preview && (
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <Box
              component="img"
              src={preview}
              alt="preview"
              sx={{ width: 64, height: 64, objectFit: "contain", border: "1px solid", borderColor: "divider", borderRadius: 1 }}
            />
            {allowRemove && (
              <IconButton
                size="small"
                onClick={handleRemove}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  p: "2px",
                  "&:hover": { bgcolor: "error.light", color: "error.contrastText", borderColor: "error.light" },
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        )}
        <Button
          variant="outlined"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? "Uploading…" : preview ? "Change Image" : "Upload Image"}
        </Button>
      </Stack>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
