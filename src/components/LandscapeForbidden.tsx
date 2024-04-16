import React from "react";
// MUI
import { Box, Typography } from "@mui/material";
// Other
import useStyles from "../styles/styles";

const LandscapeForbidden: React.FC = () => {
    const { landscapeForbiddenWrapper } = useStyles();

    const en: string = "Landscape orientation is not supported by application";
    const uk: string = "Альбомна орієнтація не підтримується додатком";

    return (
        <Box className={landscapeForbiddenWrapper}>
            <Typography variant="h6" textAlign="center">
                {en}
            </Typography>
            <Typography variant="h6" textAlign="center">
                {uk}
            </Typography>
        </Box>
    );
};

export default LandscapeForbidden;
