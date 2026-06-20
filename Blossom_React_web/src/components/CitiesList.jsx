import styles from "./CitiesList.module.css";
import CityItem from "./CityItem";
import Message from "./Message";
function CitiesList({ cities, isloading, error }) {
  if (cities.length === 0) {
    return <Message message="Please Add a city" />;
  }

  const countries = cities.reduce((array, city) => {
    if (!array.map((el) => el.country).includes(city.country)) {
      return [...array, { country: city.country }];
    } else {
      return array;
    }
  }, []);
  return (
    <div className={styles.cities}>
      {!isloading &&
        error === "" &&
        cities.map((city, i) => <CityItem city={city} key={city.id} />)}
    </div>
  );
}
export default CitiesList;
