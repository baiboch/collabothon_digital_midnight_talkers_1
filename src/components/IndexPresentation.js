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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return (
        <main>
            <article className={"indexPresentation"}>
                <h1>
                    <span>
                        URBAN HARVESTING
                    </span>
                </h1>

                <form onSubmit={handleSubmit}>
                    
                    <p>
                        <img src={'/images/seed.png'} alt="Enter number of seeds" />
                        Enter number of seeds
                    </p>

                    <input autoComplete="off" name="seeds" value={formData.seeds || ""} onChange={(e) => setFormData({...formData, seeds: e.target.value })} />

                    <button type="submit">Start</button>
                </form>

            </article>
        </main>
    );
}
export default IndexPresentation;