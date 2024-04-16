import React from "react";
// MUI
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Image
import firstStep from "../images/first_step.png";
import secondStep from "../images/second_step.png";
import thirdStep from "../images/third_step.png";
import fourthStep from "../images/fourth_step.png";
// Other
import useStyles from "../styles/styles";

const NotPWAPage: React.FC = () => {
    const { notPWAPageWrapper, accordionDetails, accordionImages } = useStyles();

    const en: string = "Please install app as shortcut on your desktop";
    const uk: string = "Установіть програму як застосунок на робочому столі";
    const howToDoIt: string = "Як це зробити?";

    return (
        <Box className={notPWAPageWrapper}>
            <Typography variant="h6" textAlign="center">
                {en}
            </Typography>
            <Typography variant="h6" textAlign="center">
                {uk}
            </Typography>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
                    {howToDoIt}
                </AccordionSummary>
                <AccordionDetails className={accordionDetails}>
                    <Typography variant="h6">Крок 1</Typography>
                    <Typography variant="subtitle2">
                        Зайшовши у браузер за посиланням Ви побачите повідомлення про те, що Вам необіхдно встановити сайт, як застосунок на робочий стіл Вашого девайсу, адже це
                        зроблено для зручного користування застосунком. Отже, у браузері натисніть на іконку &quot;Поширити&quot;, як зображено на скріншоті.
                    </Typography>
                    <img className={accordionImages} src={firstStep} alt="First step" />
                    <br />
                    <Typography variant="h6">Крок 2</Typography>
                    <Typography variant="subtitle2">
                        На дисплеї з&apos;явиться вікно з різними опціями. Вам потрібно прогорнути сторінку вниз і знайти кнопку &quot;На Початковий Екран&quot;. Натискайте її!
                    </Typography>
                    <img className={accordionImages} src={secondStep} alt="Second step" />
                    <br />
                    <Typography variant="h6">Крок 3</Typography>
                    <Typography variant="subtitle2">
                        Якщо Ви бачите наступне вікно, Ви на фінішній прямій! Знайдіть кнопку &quot;Додати&quot;, як зображено на скріншоті і натисніть її!{" "}
                    </Typography>
                    <img className={accordionImages} src={thirdStep} alt="Third step" />
                    <br />
                    <Typography variant="h6">Крок 4</Typography>
                    <Typography variant="subtitle2">Якщо Ви все зробили згідно з інструкцією, застосунок &quot;Tonality&quot; з&apos;явиться на Вашому робочому столі.</Typography>
                    <img className={accordionImages} src={fourthStep} alt="Fourth step" />
                    <br />
                    <Typography variant="h6">Застереження!</Typography>
                    <Typography variant="subtitle2">
                        Варто зазначити, що дана інструкція написана конкретно для iOS девайсів, але для пристроїв на інших платформах послідовність кроків дуже схожа. Приємного
                        користування!
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default NotPWAPage;
