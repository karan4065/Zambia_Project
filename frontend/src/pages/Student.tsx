import React, { useCallback, useEffect, useState } from "react";
import { createStudent, uploadPhoto, fetchStandardsByCategory, fetchCategories } from "../apis/api";
import "../styles/student.css";
import UploadStudents from "../components/Student/AppendStudentExcel";
import StudentsInfoDownload from "../components/Student/RetriveStudentExcel";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { installmentArr } from "../store/store";

interface Student {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  rollNo: string;
  standard: string;
  bloodGroup?: string;
  scholarshipApplied: boolean;
  lunchAccepted?: boolean;
  busAccepted?: boolean;
  busStationId?: number;
  photoUrl?: string;
  residentialAddress?: string;
  correspondenceAddress?: string;
  remark:string;
  nationality?:string;
  religion?:string;
  denomination?:string;
  language?:string;
  motherTongue?:string;
  parents: Parent[];
  fees: Fee[];
}

interface Parent {
  studentId: number;
  fatherName: string;
  motherName: string;
  fatherContact: string;
  motherContact: string;
  distanceFromSchool?: string;
  preferredPhoneNumber?: string;
  address: string;
}

interface Fee {
  installmentType: string;
  amount: number;
  amountDate: string;
  admissionDate: string;
}

interface SubjectMark {
  name: string;
  marks: number;
  total: number;
}

const Student: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Record<number, { selected: boolean; size?: string; quantity?: number }>>({});
  const [standardTotalFees, setStandardTotalFees] = useState<number>(0);
  const [showMarksheetForm, setShowMarksheetForm] = useState(false);
  const [showTCForm, setShowTCForm] = useState(false);
  const [showMarksheet, setShowMarksheet] = useState(false);
  const [marksheetError, setMarksheetError] = useState('');
  const [marksheet, setMarksheet] = useState({
    schoolName: 'ST. VINCENT PALLOTTI CATHOLIC SCHOOL WESTWOOD, LUSAKA, ZAMBIA',
    studentName: '',
    class: '',
    rollNo: '',
    subjects: [] as SubjectMark[],
    result: ''
  });
  const [selectedMarksheetExam, setSelectedMarksheetExam] = useState('Annual');
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tc, setTc] = useState({
    schoolName: 'ST. VINCENT PALLOTTI CATHOLIC SCHOOL WESTWOOD, LUSAKA, ZAMBIA',
    email: 'stvincentpzambia@yahoo.com',
    class: '',
    rollNo: '',
    studentName: '',
    nationality: '',
    dateOfBirth: '',
    admittedClass: '',
    presentGrade: '',
    lastAttendanceDate: '',
    annualResult: '',
    remarks: ''
  });
  const [student, setStudent] = useState<Student>({
    fullName: "",
    gender: "Male",
    dateOfBirth: "",
    rollNo: "",
    standard: "",
    bloodGroup: "",
    scholarshipApplied: false,
    lunchAccepted: false,
    busAccepted: false,
    busStationId: undefined,
    residentialAddress: "",
    correspondenceAddress: "",
    photoUrl: "",
    nationality: "",
    religion:"",
    denomination: "",
    language: "",
    motherTongue: "",
    parents: [
      {
        fatherName: "",
        motherName: "",
        fatherContact: "",
        motherContact: "",
        distanceFromSchool: "",
        preferredPhoneNumber: "",
        address: "",
        studentId: 0,
      },
    ],
    fees: [
      {
        installmentType: "",
        amount: 0,
        amountDate: "",
        admissionDate: "",
      },
    ],
    remark :""
  });
  
  const [classes, setClasses] = useState<string[]>([]);
  const [standardsByCategory, setStandardsByCategory] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [busStations, setBusStations] = useState<any[]>([]);
  const installmentArray = useRecoilValue(installmentArr);

  useEffect(()=>{
    async function fetchSubjects() {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/getsubjects`);
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    }
    async function fetchBusStations() {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/busStations`);
        setBusStations(response.data);
      } catch (error) {
        console.error("Error fetching bus stations:", error);
      }
    }
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    
    // fetch standards grouped by category
    async function fetchStandards() {
      try {
        const grouped = await fetchStandardsByCategory();
        const processedGrouped: Record<string, string[]> = {};
        Object.keys(grouped || {}).forEach(category => {
          const items = grouped[category];
          if (Array.isArray(items)) {
            processedGrouped[category] = items.map((item: any) => 
              typeof item === 'object' ? item.std : item
            );
          }
        });
        setStandardsByCategory(processedGrouped);
        const all = Object.values(processedGrouped).flat().sort();
        setClasses(all);
      } catch (err) {
        console.error('Error fetching standards by category', err);
      }
    }

    async function fetchInventory() {
      try {
        const res = await axios.get(`http://${window.location.hostname}:5000/inventory`);
        setInventoryItems(res.data || []);
      } catch (err) {
        console.error('Error fetching inventory', err);
      }
    }

    fetchSubjects();
    fetchBusStations();
    loadCategories();
    fetchStandards();
    fetchInventory();
  },[])

  // Auto-fill marksheet student details on blur
  // Auto-fill TC student details when both class and rollNo are entered
  useEffect(() => {
    if (tc.rollNo.trim() && tc.class.trim()) {
      handleTcRollNoBlur();
    }
  }, [tc.rollNo, tc.class]);

  // Fetch totalFees for selected standard and auto-populate the first fee installment
  useEffect(() => {
    if (student.standard) {
      async function fetchStandardTotalFees() {
        try {
          const response = await axios.get(`http://${window.location.hostname}:5000/standard/${student.standard}`);
          const totalFees = response.data?.totalFees || 0;
          setStandardTotalFees(totalFees);
          
          // Auto-populate the first fee installment amount
          if (student.fees.length > 0 && student.fees[0].amount === 0) {
            const newFees = [...student.fees];
            newFees[0] = { ...newFees[0], amount: totalFees };
            setStudent((prev) => ({ ...prev, fees: newFees }));
          }
        } catch (err) {
          console.error('Error fetching standard total fees', err);
        }
      }
      fetchStandardTotalFees();
    }
  }, [student.standard]);
  

  const handleSubmit = async () => {
    // Validation
    if (!student.fullName) { alert("Student Full Name is required."); return; }
    if (!student.rollNo) { alert("Roll Number is required."); return; }
    if (!student.standard) { alert("Please select a Class (Standard)."); return; }
    if (!student.dateOfBirth) { alert("Date of Birth is required."); return; }

    for (const [index, parent] of student.parents.entries()) {
      if (!parent.fatherName) { alert(`Father's Name is missing for parent entry ${index + 1}`); return; }
      if (!parent.fatherContact) { alert(`Father's Contact Number is missing for parent entry ${index + 1}`); return; }
      if (!parent.motherName) { alert(`Mother's Name is missing for parent entry ${index + 1}`); return; }
      if (!parent.motherContact) { alert(`Mother's Contact Number is missing for parent entry ${index + 1}`); return; }
    }

    if (student.fees.some((fee) => !fee.installmentType || !fee.amountDate)) {
      alert("Please fill all fee installment details (Type and Date).");
      return;
    }
    try {
      // prepare inventory selections
      const inventorySelections = Object.entries(selectedInventory)
        .map(([key, val]) => ({ inventoryId: parseInt(key), size: val.size, quantity: val.quantity }))
        .filter((s) => s.quantity && s.quantity > 0);

      await createStudent(({ ...student, inventorySelections } as any));
      alert("Student created successfully");
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Failed to create student");
    }
  };

  const resetForm = () => {
    setStudent({
      fullName: "",
      gender: "Male",
      dateOfBirth: "",
      rollNo: "",
      standard: "",
      bloodGroup: "",
      scholarshipApplied: false,
      lunchAccepted: false,
      busAccepted: false,
      busStationId: undefined,
      residentialAddress: "",
      correspondenceAddress: "",
      photoUrl: "",
      nationality: "",
      religion:"",
      denomination: "",
      language: "",
      motherTongue: "",
      parents: [
        {
          fatherName: "",
          motherName: "",
          fatherContact: "",
          motherContact: "",
          distanceFromSchool: "",
          preferredPhoneNumber: "",
          address: "",
          studentId: 0,
        },
      ],
      fees: [
        {
          installmentType: "",
          amount: 0,
          amountDate: "",
          admissionDate: "",
        },
      ],
      remark :""
    });
    setSelectedInventory({});
    setSelectedCategory("");
    setStandardTotalFees(0);
  };

  const handleParentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
      const { name, value } = e.target;
      const newParents = [...student.parents];
      newParents[index] = { ...newParents[index], [name]: value };
      setStudent((prev) => ({ ...prev, parents: newParents }));
    },
    [student]
  );
  

  const handleFeeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    const newFees = [...student.fees];
    newFees[index] = { ...newFees[index], [name]: value };
    setStudent((prev) => ({ ...prev, fees: newFees }));
  };

  const handleFeeChange2 = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
    const { name, value } = e.target;
    const updatedFees = [...student.fees]; // Create a copy of the fees array
    
    // Update the fee object at the specified index with the new value
    updatedFees[index] = { ...updatedFees[index], [name]: value };
    
    // Set the updated fees back into the student state
    setStudent((prevState) => ({
      ...prevState,
      fees: updatedFees, // Update only the fees field
    }));
  };
  


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const photoUrl = await uploadPhoto(file);
        setStudent((prev) => ({ ...prev, photoUrl }));
      } catch (error) {
        console.error("Error uploading image:", error);
        alert('Failed to upload image');
      }
    }
  };

  const handleMarksheetChange = (e: React.ChangeEvent<any>, field: string) => {
    setMarksheet((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Subject helper functions removed (unused)

  const saveMarksheet = async () => {
    if (!marksheet.rollNo || !marksheet.class || marksheet.subjects.length === 0) {
      alert('Please fill in roll number, class, and add subjects.');
      return;
    }

    try {
      // Fetch student by rollNo and class
      const response = await axios.get(`http://${window.location.hostname}:5000/students/rollNo?rollno=${marksheet.rollNo}&standard=${marksheet.class}`);
      if (response.status !== 200 || !response.data || response.data.message) {
        alert('Student not found.');
        return;
      }
      const student = response.data;
      const studentId = student.id;

      // For each subject, find subjectId and save
      for (const subj of marksheet.subjects) {
        const subject = subjects.find(s => s.name === subj.name && s.stdId === marksheet.class);
        if (!subject) {
          alert(`Subject ${subj.name} not found for class ${marksheet.class}.`);
          continue;
        }
        const subjectId = subject.id;
        const percentage = subj.total > 0 ? (subj.marks / subj.total) * 100 : 0;

        await axios.post(`http://${window.location.hostname}:5000/api/marks`, {
          studentId,
          subjectId,
          subjectName: subj.name,
          examinationType: selectedMarksheetExam,
          obtainedMarks: subj.marks,
          totalMarks: subj.total,
          percentage
        });
      }

      alert('Marksheet saved successfully.');
    } catch (error: any) {
      console.error('Error saving marksheet:', error);
      alert(`Failed to save marksheet: ${error.response?.data?.error || error.message}`);
    }
  };

  const downloadMarksheet = () => {
    window.print();
  };

  const handleMarksheetRollNoBlur = async () => {
     await fetchMarksForMarksheet(selectedMarksheetExam);
  };

  const fetchMarksForMarksheet = async (examType: string) => {
    if (!marksheet.rollNo.trim() || !marksheet.class.trim()) {
      return;
    }

    try {
      const response = await axios.get(`http://${window.location.hostname}:5000/students/rollNo?rollno=${marksheet.rollNo}&standard=${marksheet.class}`);
      if (response.status === 200 && response.data && !response.data.message) {
        const student = response.data;
        const studentId = student.id;
        setMarksheet((prev) => ({
          ...prev,
          studentName: student.fullName || ''
        }));
        setMarksheetError('');
        // Fetch marks and populate subjects
        try {
          const marksResponse = await axios.get(`http://${window.location.hostname}:5000/api/marks/${studentId}?examinationType=${examType}`);
          const marks = marksResponse.data;
          const subjectsFromMarks = marks.map((m: any) => ({ name: m.subjectName, marks: m.obtainedMarks, total: m.totalMarks }));
          setMarksheet((prev) => ({ ...prev, subjects: subjectsFromMarks }));
        } catch (marksError) {
          console.error('Error fetching marks:', marksError);
          setMarksheet((prev) => ({ ...prev, subjects: [] }));
        }
      } else {
        setMarksheetError('Student not exist');
        setMarksheet((prev) => ({ ...prev, studentName: '', subjects: [] }));
      }
    } catch (error) {
      console.error('Error fetching student for marksheet:', error);
      alert('Error fetching student.');
    }
  };

  const handleTcChange = (e: React.ChangeEvent<any>, field: string) => {
    setTc((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleTcRollNoBlur = async () => {
    if (!tc.rollNo.trim() || !tc.class.trim()) {
      return;
    }

    try {
      const response = await axios.get(`http://${window.location.hostname}:5000/students/rollNo?rollno=${tc.rollNo}&standard=${tc.class}`);
      if (response.status === 200 && response.data && !response.data.message) {
        const student = response.data;
        const studentId = student.id;
        setTc((prev) => ({
          ...prev,
          studentName: student.fullName || '',
          nationality: student.nationality || '',
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
          admittedClass: student.standard || ''
        }));
        // Fetch marks and calculate annual result and grade
        try {
          const marksResponse = await axios.get(`http://${window.location.hostname}:5000/api/marks/${studentId}`);
          const marks = marksResponse.data;
          const totalObtained = marks.reduce((sum: number, m: any) => sum + m.obtainedMarks, 0);
          const totalPossible = marks.reduce((sum: number, m: any) => sum + m.totalMarks, 0);
          const overallPercentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
          const result = overallPercentage >= 35 ? 'Passed' : 'Failed';
          let grade = '';
          if (overallPercentage > 90) grade = 'A+';
          else if (overallPercentage >= 80) grade = 'A';
          else if (overallPercentage >= 70) grade = 'B';
          else if (overallPercentage >= 50) grade = 'C';
          else if (overallPercentage >= 35) grade = 'D';
          else grade = 'F';
          setTc((prev) => ({ ...prev, annualResult: result, presentGrade: grade }));
        } catch (marksError) {
          console.error('Error fetching marks:', marksError);
          setTc((prev) => ({ ...prev, annualResult: 'No marks available', presentGrade: student.standard || '' }));
        }
      } else {
        alert('Student not found.');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  const downloadTC = () => {
    window.print();
  };

  return (
    <div>
      <div className="global-container">
        <div className="import_export">
          <div className="innerbox"> 
            <StudentsInfoDownload />
          </div>
          <div className="innerbox">
            <UploadStudents/>
          </div>
        </div>
      </div>
      <div className="global-container">
        <div className="student-buttons">
          <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Hide Form' : 'Create Student'}</button>
          <button onClick={() => setShowMarksheetForm(!showMarksheetForm)}>{showMarksheetForm ? 'Hide Marksheet' : 'Download Marksheet'}</button>
          <button onClick={() => setShowTCForm(!showTCForm)}>{showTCForm ? 'Hide TC' : 'Transfer Certificate'}</button>
        </div>
      </div>
      {showForm && (
        <div className="global-container">
          <h2>Create Student Profile</h2>
        <div>
          <label>Upload Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e)}
          />
        </div>
        <div>
          <label>Full Name</label>
          <input
            className="StudentInput"
            type="text"
            name="fullName"
            value={student.fullName}
            onChange={(e) => {
              setStudent((prev) => ({ ...prev, fullName: e.target.value }));
            }}
          />
        </div>
        <div>
          <label>Gender</label>
          <select
            name="gender"
            value={student.gender}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, gender: e.target.value }))
            }
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label>Date of Birth</label>
          <input
            className="studentInput"
            type="date"
            name="dateOfBirth"
            value={student.dateOfBirth}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Blood Group</label>
          <select
            name="bloodGroup"
            value={student.bloodGroup}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, bloodGroup: e.target.value }))
            }
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div>
          <label>Religion</label>
          <input
            className="studentInput"
            type="text"
            name="religion"
            value={student.religion}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, religion: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Denomination</label>
          <input
            className="studentInput"
            type="text"
            name="denomination"
            value={student.denomination}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, denomination: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Nationality</label>
          <input
            className="studentInput"
            type="text"
            name="nationality"
            value={student.nationality}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, nationality: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Language</label>
          <input
            className="studentInput"
            type="text"
            name="language"
            value={student.language}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, language: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Mother Tongue</label>
          <input
            className="studentInput"
            type="text"
            name="motherTongue"
            value={student.motherTongue}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, motherTongue: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Residential Address</label>
          <textarea
            name="residentialAddress"
            value={student.residentialAddress}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, residentialAddress: e.target.value }))
            }
          ></textarea>
        </div>
        <div>
          <label>Correspondence Address</label>
          <textarea
            name="correspondenceAddress"
            value={student.correspondenceAddress}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, correspondenceAddress: e.target.value }))
            }
          ></textarea>
        </div>
        <div>
          <label>Roll No</label>
          <input
            className="StudentInput"
            type="text"
            name="rollNo"
            value={student.rollNo}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, rollNo: e.target.value }))
            }
          />
        </div>
        <label>Standard Category</label>
        <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setStudent((prev)=>({ ...prev, standard: '' })); }}>
          <option value="">Select category</option>
          {Array.isArray(categories) && categories.map((cat, idx) => (
            <option key={idx} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        {selectedCategory && (
          <div>
            <label>Standard</label>
            <select
              name="standard"
              value={student.standard}
              onChange={(e) =>
                setStudent((prev) => ({ ...prev, standard: e.target.value }))
              }
            >
              <option value="">Select standard</option>
              {(standardsByCategory[selectedCategory] || []).map((ele: string, key: number) => (
                <option key={key} value={ele}>{ele}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label>Scholarship Applied</label>
          <input
            type="checkbox"
            name="scholarshipApplied"
            checked={student.scholarshipApplied}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, scholarshipApplied: e.target.checked }))
            }
          />
        </div>
        <div>
          <label>Accept School Lunch</label>
          <input
            type="checkbox"
            name="lunchAccepted"
            checked={student.lunchAccepted || false}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, lunchAccepted: e.target.checked }))
            }
          />
        </div>
        {student.lunchAccepted && (
          <div>
            <small>Lunch fee will be applied.</small>
          </div>
        )}
        <div>
          <label>Accept Bus Service</label>
          <input
            type="checkbox"
            name="busAccepted"
            checked={student.busAccepted || false}
            onChange={(e) =>
              setStudent((prev) => ({ ...prev, busAccepted: e.target.checked }))
            }
          />
        </div>
        {student.busAccepted && (
          <div>
            <label>Select Bus Station</label>
            <select
              className="studentInput"
              name="busStationId"
              value={student.busStationId || ""}
              onChange={(e) =>
                setStudent((prev) => ({ ...prev, busStationId: parseInt(e.target.value) }))
              }
            >
              <option value="">-- Select a Station --</option>
              {busStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.stationName} - ₹{station.price}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>  
          {student.scholarshipApplied && (
            <div>
              <label>Remark</label>
              <input
                type="text"
                name="remark"
                value={student.remark}
                onChange={(e) =>
                  setStudent((prev) => ({ ...prev, remark: e.target.value }))
                }
              />
            </div>
          )}
        </div>
        <div>
          <h3>Assign Inventory (optional)</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 8, marginBottom: 12 }}>
            {inventoryItems
              .filter((item) => {
                const itemGender = (item.gender || 'All').toString().toLowerCase();
                const studGender = (student.gender || '').toString().toLowerCase();
                if (studGender === 'male') {
                  return itemGender !== 'female';
                }
                if (studGender === 'female') {
                  return itemGender === 'female' || itemGender === 'all';
                }
                return true;
              })
              .map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedInventory[item.id]?.selected || false}
                  onChange={(e) => {
                    setSelectedInventory((prev) => ({
                      ...prev,
                      [item.id]: { ...(prev[item.id] || {}), selected: e.target.checked, size: prev[item.id]?.size || item.size || '', quantity: prev[item.id]?.quantity || 1 }
                    }));
                  }}
                />
                <div style={{ marginLeft: 8, flex: 1 }}>
                  <strong>{item.itemName}</strong> — {item.category} — ₹{(item.price || 0).toFixed(2)} — {item.gender || 'All'}
                </div>
                {selectedInventory[item.id]?.selected && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={selectedInventory[item.id]?.size || ''}
                      onChange={(e) => setSelectedInventory((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), size: e.target.value } }))}
                    >
                      <option value="">Size</option>
                      {item.size ? (
                        item.size.split(',').map((sz: string) => (
                          <option key={sz.trim()} value={sz.trim()}>{sz.trim()}</option>
                        ))
                      ) : (
                        <React.Fragment>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </React.Fragment>
                      )}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={selectedInventory[item.id]?.quantity || 1}
                      onChange={(e) => setSelectedInventory((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), quantity: parseInt(e.target.value || '1') } }))}
                      style={{ width: 70 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3>Parents</h3>
          {student.parents.map((parent, index) => (
            <div key={index}>
              <label>Father Name</label>
              <input
                className="StudentInput"
                type="text"
                name="fatherName"
                value={parent.fatherName}
                onChange={(e) => handleParentChange(e, index)}
              />
              <label>Father Contact</label>
              <input
                className="StudentInput"
                type="number"
                name="fatherContact"
                value={parent.fatherContact}
                onChange={(e) => handleParentChange(e, index)}
                maxLength={10}
                minLength={10}
              />
              <label>Mother Name</label>
              <input
                className="StudentInput"
                type="text"
                name="motherName"
                value={parent.motherName}
                onChange={(e) => handleParentChange(e, index)}
              />
              <label>Mother Contact</label>
              <input
                className="StudentInput"
                type="number"
                name="motherContact"
                value={parent.motherContact}
                onChange={(e) => handleParentChange(e, index)}
                maxLength={10}
                minLength={10}
              />
              <label>Distance from School (in kms)</label>
              <input
                className="StudentInput"
                type="number"
                name="distanceFromSchool"
                value={parent.distanceFromSchool}
                onChange={(e) => handleParentChange(e, index)}
              />
              <label>Preferred Phone Number for School</label>
              <input
                className="StudentInput"
                type="number"
                name="preferredPhoneNumber"
                value={parent.preferredPhoneNumber}
                onChange={(e) => handleParentChange(e, index)}
                maxLength={10}
                minLength={10}
              />
              <label>Address</label>
              <textarea
                className="StudentInput"
                name="address"
                value={parent.address}
                onChange={(e) => handleParentChange(e, index)}
              ></textarea>
            </div>
          ))}
        </div>
        <div>
          <h3>Fees</h3>
          {student.fees.map((fee, index) => (
            <div key={index}>
              <label>Installment Type</label>
              <select
                name="installmentType"
                value={fee.installmentType}
                onChange={(e) => handleFeeChange2(e, index)}
              >
                <option disabled>Select Type</option>
                <option value="">Select installment type</option>
                {installmentArray.map((ele,id)=>(
                  <option key={id} value={ele}>{ele}</option>
                ))}
              </select>

              <label>Amount</label>
              <input
                className="studentInput"
                type="number"
                name="amount"
                value={fee.amount}
                onChange={(e) => handleFeeChange(e, index)} // This will allow the user to input the value manually
              />

              <label>Amount Date</label>
              <input
                className="studentInput"
                type="date"
                name="amountDate"
                value={fee.amountDate}
                onChange={(e) => handleFeeChange(e, index)}
              />
              <label>Admission Date</label>
              <input
                className="studentInput"
                type="date"
                name="admissionDate"
                value={fee.admissionDate}
                onChange={(e) => handleFeeChange(e, index)}
              />
            </div>
            
          ))}
           {standardTotalFees > 0 && (
            <div style={{ marginBottom: 16, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
              <p><strong>Total Fees for {student.standard}:</strong> ₹{standardTotalFees.toFixed(2)}</p>
              <p><strong>Remaining Fees:</strong> ₹{Math.max(0, standardTotalFees - (student.fees.reduce((sum, fee) => sum + (parseFloat(fee.amount.toString()) || 0), 0))).toFixed(2)}</p>
            </div>
          )}
        </div>
        <button type="button" onClick={handleSubmit}>
          Submit
        </button>
        </div>
      )}
      {showMarksheetForm && (
        <div className="global-container">
          <h2>Marksheet Form</h2>
          <div>
            <label>School Name</label>
            <input
              type="text"
              value={marksheet.schoolName}
              onChange={(e) => handleMarksheetChange(e, 'schoolName')}
            />
          </div>
          <div>
            <label>Class</label>
            <select
              value={marksheet.class}
              onChange={(e) => handleMarksheetChange(e, 'class')}
              onBlur={handleMarksheetRollNoBlur}
            >
              <option value="">Select Class</option>
              {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div>
            <label>Roll No</label>
            <input
              type="text"
              value={marksheet.rollNo}
              onChange={(e) => handleMarksheetChange(e, 'rollNo')}
              onBlur={handleMarksheetRollNoBlur}
            />
          </div>
          <div>
            <label>Examination Type</label>
            <select
              value={selectedMarksheetExam}
              onChange={(e) => {
                const newVal = e.target.value;
                setSelectedMarksheetExam(newVal);
                fetchMarksForMarksheet(newVal);
              }}
              onBlur={handleMarksheetRollNoBlur}
            >
              <option value="Annual">Annual</option>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
              <option value="Final Semester">Final Semester</option>
            </select>
          </div>
          {marksheetError && <p style={{ color: 'red' }}>{marksheetError}</p>}
          <button onClick={() => setShowMarksheet(true)}>View</button>
          {showMarksheet && (
            <React.Fragment>
          <div className="marksheet" id="marksheet">
            <h1>{marksheet.schoolName}</h1>
            <h2>Marksheet</h2>
            <div className="student-details">
              <p><strong>Student Name:</strong> {marksheet.studentName}</p>
              <p><strong>Class:</strong> {marksheet.class}</p>
              <p><strong>Roll No:</strong> {marksheet.rollNo}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks Obtained</th>
                  <th>Total Marks</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {marksheet.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td>{subject.name}</td>
                    <td>{subject.marks}</td>
                    <td>{subject.total}</td>
                    <td>{subject.total > 0 ? ((subject.marks / subject.total) * 100).toFixed(2) + '%' : '0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total">
              <p><strong>Total Marks:</strong> {marksheet.subjects.reduce((sum, s) => sum + s.marks, 0)} / {marksheet.subjects.reduce((sum, s) => sum + s.total, 0)}</p>
              <p><strong>Overall Percentage:</strong> {(() => {
                const totalPossible = marksheet.subjects.reduce((sum, s) => sum + s.total, 0);
                const percentage = totalPossible > 0 ? ((marksheet.subjects.reduce((sum, s) => sum + s.marks, 0) / totalPossible) * 100) : 0;
                return percentage.toFixed(2) + '%';
              })()}</p>
              <p><strong>Result:</strong> {(() => {
                const totalPossible = marksheet.subjects.reduce((sum, s) => sum + s.total, 0);
                const percentage = totalPossible > 0 ? ((marksheet.subjects.reduce((sum, s) => sum + s.marks, 0) / totalPossible) * 100) : 0;
                return percentage > 35 ? 'Pass' : 'Fail';
              })()}</p>
            </div>
            <div className="signatures">
              <div className="signature-left">
                <span>Signature of Class Teacher</span>
                <div className="signature-line"></div>
              </div>
              <div className="signature-right">
                <span>Signature of Principal</span>
                <div className="signature-line"></div>
              </div>
            </div>
          </div>
           <div className="id">
            <button onClick={saveMarksheet} style={{ marginRight: '10px' }}>Save Marksheet</button>
          <button onClick={downloadMarksheet}>Download Marksheet</button>
           </div>
          </React.Fragment>
          )}
          </div>
      )}
      {showTCForm && (
        <div className="global-container">
          <h2>Transfer Certificate Form</h2>
          <div>
            <label>School Name</label>
            <input
              type="text"
              value={tc.schoolName}
              onChange={(e) => handleTcChange(e, 'schoolName')}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={tc.email}
              onChange={(e) => handleTcChange(e, 'email')}
            />
          </div>
          <div>
            <label>Class</label>
            <select
              value={tc.class}
              onChange={(e) => handleTcChange(e, 'class')}
              onBlur={handleTcRollNoBlur}
            >
              <option value="">Select Class</option>
              {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div>
            <label>Roll No</label>
            <input
              type="text"
              value={tc.rollNo}
              onChange={(e) => handleTcChange(e, 'rollNo')}
              onBlur={handleTcRollNoBlur}
            />
          </div>
          <div>
            <label>Name of Student</label>
            <input
              type="text"
              value={tc.studentName}
              onChange={(e) => handleTcChange(e, 'studentName')}
            />
          </div>
          <div>
            <label>Nationality</label>
            <input
              type="text"
              value={tc.nationality}
              onChange={(e) => handleTcChange(e, 'nationality')}
            />
          </div>
          <div>
            <label>Date of Birth</label>
            <input
              type="date"
              value={tc.dateOfBirth}
              onChange={(e) => handleTcChange(e, 'dateOfBirth')}
            />
          </div>
          <div>
            <label>Class to which student was admitted</label>
            <input
              type="text"
              value={tc.admittedClass}
              onChange={(e) => handleTcChange(e, 'admittedClass')}
            />
          </div>
          <div>
            <label>Present Grade</label>
            <input
              type="text"
              value={tc.presentGrade}
              onChange={(e) => handleTcChange(e, 'presentGrade')}
            />
          </div>
          <div>
            <label>Last date of attendance in the school</label>
            <input
              type="date"
              value={tc.lastAttendanceDate}
              onChange={(e) => handleTcChange(e, 'lastAttendanceDate')}
            />
          </div>
          <div>
            <label>Result of annual examination</label>
            <input
              type="text"
              value={tc.annualResult}
              onChange={(e) => handleTcChange(e, 'annualResult')}
            />
          </div>
          <div>
            <label>Remarks</label>
            <textarea
              value={tc.remarks}
              onChange={(e) => handleTcChange(e, 'remarks')}
            />
          </div>
          <div className="tc" id="tc">
            <div className="tc-header">
              <p><strong>School Name:</strong> {tc.schoolName}</p>
              <p><strong>Email:</strong> {tc.email}</p>
            </div>
            <h2 style={{textAlign: 'center'}}>Transfer Certificate</h2>
            <p><strong>Name of Student:</strong> {tc.studentName}</p>
            <p><strong>Nationality:</strong> {tc.nationality}</p>
            <p><strong>Date of Birth:</strong> {tc.dateOfBirth}</p>
            <p><strong>Class to which student was admitted:</strong> {tc.admittedClass}</p>
            <p><strong>Present Grade:</strong> {tc.presentGrade}</p>
            <p><strong>Last date of attendance in the school:</strong> {tc.lastAttendanceDate}</p>
            <p><strong>Result of annual examination:</strong> {tc.annualResult}</p>
            <p><strong>Remarks:</strong> {tc.remarks}</p>
            <div className="signatures">
              <div className="signature-left">
                <span>Principal</span>
                <div className="signature-line"></div>
              </div>
              <div className="signature-right">
                <span>Head Teacher</span>
                <div className="signature-line"></div>
              </div>
            </div>
          </div>
          <button onClick={downloadTC}>Download Transfer Certificate</button>
        </div>
      )}
    </div>
);
};

export default Student;

