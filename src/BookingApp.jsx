import React, { useState, useEffect } from 'react';
import './BookingApp.css';

const BookingApp = () => {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    room: '',
    duration: '',
    fromDate: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    country: '',
    state: ''
  });
  const [dateError, setDateError] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office"
      );
      const data = await response.json();
      setRooms(data.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const calculateEndDate = () => {
    if (!formData.fromDate || !formData.duration) return null;

    const fromDate = new Date(formData.fromDate);
    
    switch(formData.duration) {
      case 'weekly':
        fromDate.setDate(fromDate.getDate() + 7);
        break;
      case 'monthly':
        fromDate.setMonth(fromDate.getMonth() + 1);
        break;
      case 'yearly':
        fromDate.setFullYear(fromDate.getFullYear() + 1);
        break;
      default:
        return null;
    }

    fromDate.setDate(fromDate.getDate() - 1);
    return fromDate.toISOString().split('T')[0];
  };

  const formatDate = (date) => {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}T00:12:12+01:00`;
    }
    throw new Error("Unsupported date format");
  };

  const checkRoomAvailability = async () => {
    setDateError('');
    setDateRange('');

    const end = calculateEndDate();
    if (!formData.fromDate || !end) {
      setDateError("Please select both from and to dates");
      return false;
    }

    const fromDate = new Date(formData.fromDate);
    const toDate = new Date(end);
    if (fromDate >= toDate) {
      setDateError("From date must be before to date");
      return false;
    }

    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);
      const selectedRoomId = formData.room;

      const response = await fetch(
        `https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office/${selectedRoomId}?from=${formattedFromDate}&to=${formattedToDate}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available rooms");
      }

      const responseRooms = await response.json();
      const availableRooms = responseRooms.data;

      if (availableRooms === "Booked") {
        setDateError("No rooms available for selected dates");
        return false;
      }

      setDateRange("Booking is available");
      setSelectedRoomId(selectedRoomId);
      return true;
    } catch (error) {
      console.error("Error checking room availability:", error);
      setDateError("Error checking room availability");
      setSelectedRoomId(null);
      return false;
    }
  };

  const createUser = async () => {
    const userData = {
      name: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      address: formData.address,
      state: formData.state,
      country: formData.country,
      code: "",
      referral: "Private Office Form",
    };

    try {
      const response = await fetch(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const userResponse = await response.json();
      return userResponse.data.id;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  const submitBooking = async (userId) => {
    const end = calculateEndDate();
    const bookingData = {
      username: `${formData.firstName} ${formData.lastName}`,
      user: userId,
      from: formatDate(new Date(formData.fromDate)),
      to: formatDate(new Date(end)),
      room: selectedRoomId,
      flexible: "no",
      description: "Booking submitted via web form",
    };

    try {
      const response = await fetch(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit booking");
      }

      return true;
    } catch (error) {
      console.error("Error submitting booking:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoomId) {
      setDateError("Please select available dates first");
      return;
    }

    try {
      const userId = await createUser();
      await submitBooking(userId);
      setCurrentStep(2);
    } catch (error) {
      setDateError("Booking failed. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      room: '',
      duration: '',
      fromDate: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      country: '',
      state: ''
    });
    setCurrentStep(1);
    setDateError('');
    setDateRange('');
    setSelectedRoomId(null);
  };

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h1>Book Now</h1>
        <div className="progress-steps">
          <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Information</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Finished</div>
          </div>
        </div>

        {currentStep === 1 && (
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="section-title">Office</div>
              <select 
                value={formData.room} 
                onChange={(e) => setFormData(prev => ({...prev, room: e.target.value}))}
                required
              >
                <option value="">Select an office</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.Name}</option>
                ))}
              </select>

              <div className="section-title">Time Period</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <select 
                    value={formData.duration} 
                    onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>From Date</label>
                  <input 
                    type="date" 
                    id="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required 
                    onBlur={checkRoomAvailability}
                  />
                </div>
              </div>
              {dateError && <div className="date-error">{dateError}</div>}
              {dateRange && <div className="date-range">{dateRange}</div>}
            </div>

            <div className="form-section">
              <div className="section-title">Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@example.com"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company</label>
                  <input 
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({...prev, country: e.target.value}))}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="Albania">Albania</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IN">India</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>State/Province</label>
                  <input 
                    type="text"
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State or Province"
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="button-group">
              <button type="button" className="btn btn-cancel" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-next">
                Next
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <div className="success-container">
            <img 
              src="http://35.176.180.59/wp-content/uploads/2024/11/undraw_mail_sent_re_0ofv-1.png" 
              alt="Success" 
            />
            <h3>Your request was sent successfully</h3>
            <p>Check your email for further details.</p>
            <button onClick={resetForm} className="btn btn-next">
              Book Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingApp;