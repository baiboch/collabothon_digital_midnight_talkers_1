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
    }, [])

    return (
        <article className={"indexPresentation"}>
            <h1>Urban Harvesting</h1>

            <form onSubmit={handleSubmit}>
                <input name="seeds" value={formData.seeds || ""} onChange={(e) => setFormData({...formData, seeds: e.target.value })} />

                <button type="submit">Continue</button>
            </form>

        </article>
    );
}
export default IndexPresentation;