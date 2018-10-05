import React, { Component } from 'react';
import { personAutocomplete, theMovieDB } from '../../axios';

import styles from './PersonCompare.module.css';
import Autocomplete from '../../components/UI/Autocomplete/Autocomplete';
import Person from '../../components/Person/Person';

class PersonCompare extends Component {
	state = {
		people: [],
		autocompleteData: [],
		autocompleteNames: [],
		commonCredits: []
	}

	searchChange = (e) => {
		const searchValue = e.target.value;
		if(searchValue.length>0){
			personAutocomplete.get(`/?name=${searchValue}`)
				.then(res =>{
					this.setState({
						autocompleteData: res.data,
						autocompleteNames: res.data.map(match => match.name)
					});
				})
				.catch(err => {
					this.setState({ error: err.response.statusText });
					console.log( err.response.data.error );
				});
		}
	}

	searchSelect = (e) => {
		const person = this.state.autocompleteData.find(person => person.name===e.target.value);
		if(person && person.id){
			theMovieDB.get(`/person/${person.id}?append_to_response=combined_credits`)
				.then(res =>{
					const newPeople = this.state.people.slice();

					const sortedCredits = res.data.combined_credits.cast.sort((a, b) => a.popularity < b.popularity);
					res.data.credits = sortedCredits;
					
					newPeople.push(res.data);
					this.setState({ people: newPeople}, this.updateCommonCredits);

					e.target.value = '';
				})
				.catch(err => {
					this.setState({ error: err.response.statusText });
					console.log( err.response.data['status_message'] );
				});
		}
	}

	updateCommonCredits = () => {
		if(this.state.people.length<2){
			this.setState({
				commonCredits: []
			});
			return;
		}

		//	In order to find the common credits we will check if the credits from
		//	the person with the least of them are present in every person's credit list

		//	get only the credit lists and sort them in asc order so the first one has the least number of credits
		const creditLists = this.state.people.map(p => p.credits).sort((a, b) => a.length>b.length);
		const numberOfLists = creditLists.length;
		let commonCredits = [];
		//	check if each credit in the first's person list are inside the other lists
		creditLists[0].forEach(credit => {
			let isCommon = true;

			for(let i=1; i<numberOfLists; i++){
				if(!this.creditInCreditList(credit, creditLists[i])){
					isCommon = false;
					break;
				}
			}

			if(isCommon){
				commonCredits.push(credit);
			}
		});

		this.setState({
			commonCredits
		});
	}

	creditInCreditList = (credit, list) => {
		for(const c of list){
			if (c.id === credit.id){
				return true;
			}
		}

		return false;
	}

	removePerson = (personIndex) => {
		const newPeople = this.state.people.slice();
		newPeople.splice(personIndex, 1);
		this.setState({ people: newPeople }, this.updateCommonCredits);
	}

	render () {
		return (
			<div className={styles.PersonCompare}>
				<Autocomplete 
					matches={this.state.autocompleteNames}
					change={this.searchChange} 
					select={this.searchSelect} />
				<div className={styles.credits}>
					{this.state.commonCredits.map(c => c.media_type==='tv' ? c.name : c.title+', ')}
				</div>
				<div className={styles.People}>
					{this.state.people.map((person, i) =>
						<Person
							key={i}
							data={person}
							remove={() => this.removePerson(i)} />
					)}
				</div>
			</div>
		);
	}
}

export default PersonCompare;