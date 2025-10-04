import { Button } from "@mui/material";
import { useEffect, useState } from "react";

interface UploadImageComponent {
  label: string;
}

export function UploadImage({ label }: UploadImageComponent) {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }

    const objectUrl: any = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSelectFile = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }

    setSelectedFile(e.target.files[0]);
  };

  return (
    <>
      <label>{label}</label>
      <Button
        variant="outlined"
        sx={{
          color: "#bebebfff",
          borderColor: "#bebebf66",
          "&:hover": {
            borderColor: "lightgray",
            backgroundColor: "#5d5d5d0f",
          },
        }}
      >
        <input
          type="file"
          accept="jpeg, .jpg, .png"
          onChange={onSelectFile}
        />
      </Button>
      {selectedFile && <img src={preview} />}
    </>
  );
}
