import requests

base_url = 'https://clinicaltrials.gov/api/v2'

params = {
    'query.term': 'Paracetamol',
    'pageSize': 25,
    'sort': 'ResultsFirstPostDate'
}

response = requests.get(base_url + '/studies', params=params)

studies = response.json()['studies']

aggregated = {}

for study in studies:
    if study['hasResults']:
        if 'seriousEvents' in study['resultsSection']['adverseEventsModule']:
            events = study['resultsSection']['adverseEventsModule']['seriousEvents']

            for event in events:
                if event['stats'][0]['numAtRisk'] > 0:
                    name = event['term']
                    probability = event['stats'][0]['numAffected'] / event['stats'][0]['numAtRisk']

                    if name in aggregated:
                        aggregated[name].append(probability)
                    else:
                        aggregated[name] = [probability]

results = [
    {
        'side_effect_name': name,
        'side_effect_probability': sum(probabilities) / len(probabilities),
    } for name, probabilities in aggregated.items()
]

for x in results:
    if x['side_effect_probability'] > 0.01:
        print(x)
