import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import styles from "./Modal.module.css";

export default function InfoModal({ open, onClose, children, title, isError, }) {
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: isError ? "1.5px solid red" : "1px solid #999999",
    boxShadow: 24,
    p: 4,
  };

  return (
    <div>
      {/* <Button onClick={handleOpen}>Open modal</Button> */}
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h5"
            component="h5"
            fontWeight={"700"}
            color={isError ? "red" : "#9999999"}
            style={{ marginBottom: 5 }}
          >
            {title}
          </Typography>
          <div className={styles.modalbody}>{children}</div>
        </Box>
      </Modal>
    </div>
  );
}
