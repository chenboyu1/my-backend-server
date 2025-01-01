import xml.etree.ElementTree as ET
import csv
import mysql.connector
import requests
import os
import traceback
import pymysql
import time
from datetime import datetime

def fetch_and_store_data():
    # XML URL
    xml_url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWA-2B8945E0-28E7-49F2-8428-B87F1B87CB0D&format=XML'
    
    # Download XML data
    try:
        response = requests.get(xml_url, timeout=10)
        response.raise_for_status()
        print("XML Data Downloaded Successfully")
    except requests.exceptions.RequestException as e:
        print(f"Network Error: {e}")
        return

    # CSV file path
    csv_file_path = r'c:\Users\Administrator\Desktop\weather_data.csv'  

    # Define CSV headers
    headers = [
        "StationName", "StationId", "ObservationTime", 
        "Latitude_TWD67", "Longitude_TWD67", "Latitude_WGS84", "Longitude_WGS84", 
        "Altitude", "CountyName", "TownName", "Weather", "VisibilityDescription", 
        "SunshineDuration", "Precipitation", "WindDirection", "WindSpeed", 
        "AirTemperature", "RelativeHumidity", "AirPressure", "UVIndex"
    ]

    # Safe extraction function
    def safe_get_text(element, default=""):
        if element is not None:
            return element.text
        else:
            print(f"Element not found: {default}")  # Debugging output
            return default
        
    # Parse XML
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as e:
        print(f"XML Parsing Error: {e}")
        return

    with open(csv_file_path, mode='w', newline='', encoding='utf-8') as csv_file:
        print("Opening CSV file for writing...")
        writer = csv.writer(csv_file)
        writer.writerow(headers)

        # Extract data (no namespace)
        stations = root.findall('.//stations')
        print(f"Found {len(stations)} stations without namespace")

        if len(stations) == 0:
            print("No stations found. Check the XML structure.")
            return

        for station in stations:
            # print("Processing station:")
            # print(ET.tostring(station, encoding='utf-8').decode('utf-8'))  # Print the full station XML for debugging

            # Extract coordinates for TWD67 and WGS84
            twd67_lat = twd67_lon = wgs84_lat = wgs84_lon = ""
            
            # Iterate over <Coordinates> elements
            for coordinates in station.findall('.//Coordinates'):
                coordinate_name = safe_get_text(coordinates.find('CoordinateName'), "").strip()
                if coordinate_name == "TWD67":
                    twd67_lat = safe_get_text(coordinates.find('StationLatitude'), "")
                    twd67_lon = safe_get_text(coordinates.find('StationLongitude'), "")
                elif coordinate_name == "WGS84":
                    wgs84_lat = safe_get_text(coordinates.find('StationLatitude'), "")
                    wgs84_lon = safe_get_text(coordinates.find('StationLongitude'), "")

            station_data = [
                safe_get_text(station.find('StationName'), ""),
                safe_get_text(station.find('StationId'), ""),
                safe_get_text(station.find('ObsTime/DateTime'), ""),
                
                # Coordinates
                twd67_lat, twd67_lon,
                wgs84_lat, wgs84_lon,
                
                # Altitude and Location details
                safe_get_text(station.find('GeoInfo/StationAltitude'), ""),
                safe_get_text(station.find('GeoInfo/CountyName'), ""),
                safe_get_text(station.find('GeoInfo/TownName'), ""),
                
                # Weather details
                safe_get_text(station.find('WeatherElement/Weather'), ""),
                safe_get_text(station.find('WeatherElement/VisibilityDescription'), ""),
                safe_get_text(station.find('WeatherElement/SunshineDuration'), ""),
                safe_get_text(station.find('WeatherElement/Now/Precipitation'), ""),
                safe_get_text(station.find('WeatherElement/WindDirection'), ""),
                safe_get_text(station.find('WeatherElement/WindSpeed'), ""),
                safe_get_text(station.find('WeatherElement/AirTemperature'), ""),
                safe_get_text(station.find('WeatherElement/RelativeHumidity'), ""),
                safe_get_text(station.find('WeatherElement/AirPressure'), ""),
                safe_get_text(station.find('WeatherElement/UVIndex'), "")
            ]

            # Print the station data to verify
            # print("Station Data:", station_data)

            # Write row to CSV
            writer.writerow(station_data)

    print("Data successfully written to CSV.")


    # Connect to MySQL and insert data
    try:
        conn = pymysql.connect(
            host="localhost",
            user="root",
            password="dbms41126",
            database="login",
        )
        cursor = conn.cursor()

        # Insert data for all fields in the table
        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip header
            for row in reader:
                #print(row)
                sql = """
                INSERT INTO Weather (
                    StationName, StationId, ObservationTime, Latitude_TWD67, Longitude_TWD67,
                    Latitude_WGS84, Longitude_WGS84, Altitude, CountyName, TownName,
                    Weather, VisibilityDescription, SunshineDuration, Precipitation,
                    WindDirection, WindSpeed, AirTemperature, RelativeHumidity, 
                    AirPressure, UVIndex
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, row)

        conn.commit()
        cursor.close()
        conn.close()

        print("Data successfully updated in database.")
    except pymysql.Error as err:
        print(f"MySQL 連接錯誤: {err}")
        traceback.print_exc()  # 輸出完整的異常堆疊資訊
        raise  # 重新拋出異常
    except Exception as e:
        print(f"其他錯誤: {e}")
        traceback.print_exc()  # 輸出完整的異常堆疊資訊
        raise

# Set the interval for each fetch to 1 hour (3600 seconds)
def run_periodically():
    id = 1
    while True:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"Fetching data at: {current_time} id = {id}")
        id += 1
        fetch_and_store_data()  # Fetch and store data
        # print("Waiting for the next fetch...")
        time.sleep(600)  # Wait for 1 hour (3600 seconds)

# Run the function
run_periodically()
