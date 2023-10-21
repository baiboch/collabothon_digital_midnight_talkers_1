import { useState } from "react";

import GamePresentation from "./GamePresentation";
import IndexPresentation from "./IndexPresentation";

const PageProvider = () => {

    const [state, setState] = useState({
        page: 0,
        seeds: 10,
    });

    switch (state.page) {
        case 1: {
            return <GamePresentation state={state} setState={setState} />
        }
        default: {
            return <IndexPresentation state={state} setState={setState} />
        }
    }
}
export default PageProvider;