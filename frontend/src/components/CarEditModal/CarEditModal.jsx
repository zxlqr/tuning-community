/**
 * Модальное окно для редактирования автомобиля
 */
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCar } from '../../api/cars'
import './CarEditModal.css'

const CarEditModal = ({ car, onClose }) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    brand: car.brand || '',
    model: car.model || '',
    generation: car.generation || '',
    year: car.year || new Date().getFullYear(),
    license_plate: car.license_plate || '',
    vin: car.vin || '',
    color: car.color || '',
  })
  const [errors, setErrors] = useState({})

  const updateCarMutation = useMutation({
    mutationFn: (data) => updateCar(car.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cars'])
      onClose()
    },
    onError: (error) => {
      if (error.response?.data) {
        const errorData = error.response.data
        const newErrors = {}
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            newErrors[key] = value[0]
          } else if (typeof value === 'string') {
            newErrors[key] = value
          }
        }
        setErrors(newErrors)
      } else {
        setErrors({ general: 'Ошибка при обновлении автомобиля' })
      }
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    if (!formData.brand || !formData.model) {
      setErrors({ general: 'Заполните все обязательные поля (марка и модель)' })
      return
    }

    if (!formData.year || isNaN(parseInt(formData.year))) {
      setErrors({ general: 'Укажите корректный год выпуска' })
      return
    }

    const submitData = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: parseInt(formData.year),
    }

    if (formData.license_plate?.trim()) {
      submitData.license_plate = formData.license_plate.trim()
    }
    if (formData.generation?.trim()) {
      submitData.generation = formData.generation.trim()
    }
    if (formData.vin?.trim()) {
      submitData.vin = formData.vin.trim()
    }
    if (formData.color?.trim()) {
      submitData.color = formData.color.trim()
    }

    updateCarMutation.mutate(submitData)
  }

  return (
    <div className="car-edit-modal-overlay" onClick={onClose}>
      <div className="car-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать автомобиль</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-brand">Марка *</label>
              <input
                type="text"
                id="edit-brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={errors.brand ? 'error' : ''}
                required
              />
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-model">Модель *</label>
              <input
                type="text"
                id="edit-model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={errors.model ? 'error' : ''}
                required
              />
              {errors.model && <span className="error-message">{errors.model}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-generation">Поколение/Кузов</label>
              <input
                type="text"
                id="edit-generation"
                name="generation"
                value={formData.generation}
                onChange={handleChange}
                placeholder="Например: JZX90"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-year">Год выпуска *</label>
              <input
                type="number"
                id="edit-year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={errors.year ? 'error' : ''}
                required
              />
              {errors.year && <span className="error-message">{errors.year}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-license_plate">Госномер</label>
              <input
                type="text"
                id="edit-license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-vin">VIN-код</label>
              <input
                type="text"
                id="edit-vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                maxLength="17"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-color">Цвет</label>
            <input
              type="text"
              id="edit-color"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save" disabled={updateCarMutation.isLoading}>
              {updateCarMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CarEditModal

