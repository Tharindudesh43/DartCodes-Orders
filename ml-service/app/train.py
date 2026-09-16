"""
Train a text classification model using the customer message dataset.
The model is a scikit-learn pipeline that vectorizes the text using TF-IDF
and then applies a logistic regression classifier. The trained model is saved
to disk for later use by the classify.py module. 
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "Customer_Message_Dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classifier.joblib")

def main():
    df = pd.read_csv(DATA_PATH)

    before = len(df)
    df = df[df["category"].notna() & (df["category"].str.strip() != "")]
    unlabeled_dropped = before - len(df)

    before_msg_check = len(df)
    df = df[df["message"].notna() & (df["message"].str.strip() != "")]
    empty_message_dropped = before_msg_check - len(df)

    print(f"Loaded {before} rows total | "
          f"{unlabeled_dropped} unlabeled dropped | "
          f"{empty_message_dropped} rows with missing message text dropped | "
          f"{len(df)} usable rows remain.")

    X = df["message"]
    y = df["category"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            C=10,
        )),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("\n=== Classification Report (held-out test set) ===")
    print(classification_report(y_test, y_pred))

    print("=== Confusion Matrix ===")
    labels = sorted(y.unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    print("Labels:", labels)
    print(cm)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()