import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import FeatureUnion
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

# Load the CSV dataset
df = pd.read_csv("src/data/synthetic_triage_data.csv")

# Combine all features into one column for TF-IDF processing
df['combined'] = df['symptoms'] + " " + df['duration'] + " " + df['severity']

# Split data
X = df[['combined']]
y = df['triage_level']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# TF-IDF Vectorizer
vectorizer = TfidfVectorizer()

# Wrap in a pipeline
pipeline = Pipeline([
    ('tfidf', vectorizer),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train
pipeline.fit(X_train['combined'], y_train)

# Evaluate
y_pred = pipeline.predict(X_test['combined'])
print(classification_report(y_test, y_pred))

# Save the model
joblib.dump(pipeline, "src/nlp/triage_classifier.pkl")
print("✅ Model saved to src/nlp/triage_classifier.pkl")
