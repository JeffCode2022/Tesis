import pandas as pd
import os
path = os.path.join(os.path.dirname(__file__), 'cardio_train.csv')
print('CSV path:', path)
df = pd.read_csv(path)
print('Shape:', df.shape)
print('\nColumns:', list(df.columns))
print('\nHead:\n', df.head().to_string())
print('\nMissing values:\n', df.isnull().sum())
# class balance
if 'cardio' in df.columns:
    print('\nTarget `cardio` value counts:\n', df['cardio'].value_counts(normalize=False).to_string())
    print('\nTarget `cardio` relative distribution:\n', df['cardio'].value_counts(normalize=True).to_string())
# age interpretation
if 'age' in df.columns:
    print('\nAge sample values (first 10):', df['age'].head(10).tolist())
    print('Suggest converting age to years: age_years = age / 365.25')
    try:
        ages_years = (df['age']/365.25).round(1)
        print('Age (years) sample:', ages_years.head(10).tolist())
        print('Age years stats:\n', ages_years.describe().to_string())
    except Exception as e:
        print('Could not convert age to years:', e)
# unique for categorical fields
for col in ['gender','cholesterol','gluc','smoke','alco','active']:
    if col in df.columns:
        print(f"\nUnique values for {col}:", df[col].unique())
# basic numeric stats for bp and bmi
for col in ['ap_hi','ap_lo','height','weight','cholesterol','gluc']:
    if col in df.columns:
        print(f"\n{col} stats:\n", df[col].describe().to_string())
print('\nDone')
