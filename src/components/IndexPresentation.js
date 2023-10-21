import { useEffect, useState } from "react";

const IndexPresentation = ({ state, setState }) => {
    
    const [ formData, setFormData ] = useState({});

    const handleSubmit = (e) => {

        e.preventDefault();

        setState({
            ...state,
            ...formData,
            page: 1,
        })
    }

    useEffect(() => {
        setFormData({...formData, ...state})

        return () => {
            setFormData({})
        }
    }, [state, formData])

    return (
        <main>
            <article className={"indexPresentation"}>
                <h1>
                    <span>
                        Urban Harvesting
                    </span>
                </h1>

                <form onSubmit={handleSubmit}>
                    
                    <p>Enter number of seeds</p>

                    <input autoComplete="off" name="seeds" value={formData.seeds || ""} onChange={(e) => setFormData({...formData, seeds: e.target.value })} />

                    <button type="submit">Start</button>
                </form>

            </article>
        </main>
    );
}
export default IndexPresentation;