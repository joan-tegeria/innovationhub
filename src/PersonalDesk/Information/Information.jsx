import React from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
export default function Information() {
  return (
    <div className={styles.formBody}>
      <div className={styles.sectionTittle}>Time Period</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Time Period"}
          placeholder={"eg. John"}
          onChange={(event) => console.log(event.target.value)}
        />
        <LabeledInput
          type="date"
          label={"Select Date"}
          onChange={(value) => console.log(value)}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Personal Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"First Name"}
          placeholder={"eg. John"}
          onChange={(event) => console.log(event.target.value)}
        />
        <LabeledInput label={"Last Name"} placeholder={"eg. Doe"} />
      </div>
      <div className={styles.formRow}>
        <LabeledInput
          type="date"
          label={"Birthday"}
          onChange={(value) => console.log(value)}
        />
        <LabeledInput
          label={"Identification Number"}
          placeholder={"XXXXXXXXX"}
        />
      </div>
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput label={"Email"} placeholder={"XXXXXXXXX"} />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
