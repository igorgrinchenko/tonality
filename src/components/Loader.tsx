import React, { Fragment, useEffect, useState } from "react";
// MUI
import { Box } from "@mui/material";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
// Other
import useStyles from "../styles/styles";

const Loader: React.FC = () => {
    const [scale, setScale] = useState<number>(1);

    const inlineStyles = {
        transition: "all 1.5s ease",
        transform: `scale(${scale})`,
    };

    useEffect(() => {
        setScale(1.5);
        const interval = setInterval(() => {
            setScale((prevScale: number) => (prevScale === 1 ? 1.5 : 1));
        }, 800);

        return () => clearInterval(interval);
    }, []);
    const { blur, loader } = useStyles();

    return (
        <Fragment>
            <Fragment>
                <Box className={blur}></Box>
            </Fragment>
            {/* <CircularProgress className={loader} /> */}
            <AudiotrackIcon className={loader} sx={inlineStyles} />
        </Fragment>
    );
};

export default Loader;
